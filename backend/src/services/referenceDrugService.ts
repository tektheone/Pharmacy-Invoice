import { Drug } from './discrepancyChecker';

// The external API may return either { name, unitPrice } or { drugName, standardUnitPrice }
export interface ReferenceDrugResponse {
  id?: string | number;
  name?: string;
  drugName?: string;
  strength?: string;
  formulation?: string;
  payer?: string;
  unitPrice?: number | string;
  standardUnitPrice?: number | string;
}

export class ReferenceDrugService {
  private readonly API_URL = 'https://685daed17b57aebd2af6da54.mockapi.io/api/v1/drugs';
  private cache: Drug[] | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch reference drugs from API
   */
  async fetchReferenceDrugs(): Promise<Drug[]> {
    try {
      // Check cache first
      if (this.cache && Date.now() < this.cacheExpiry) {
        return this.cache;
      }

      const response = await fetch(this.API_URL);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reference drugs: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as ReferenceDrugResponse[];
      
      // Transform and validate the data
      const drugs = this.transformReferenceData(data);
      
      // Update cache
      this.cache = drugs;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      
      return drugs;
    } catch (error) {
      console.error('Error fetching reference drugs:', error);
      
      // Return cached data if available, even if expired
      if (this.cache) {
        console.warn('Using cached reference drug data due to API failure');
        return this.cache;
      }
      
      throw new Error(`Failed to fetch reference drugs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transform API response to internal Drug format
   */
  private transformReferenceData(data: ReferenceDrugResponse[]): Drug[] {
    return data.map(item => {
      const idValue = (item.id !== undefined ? String(item.id) : undefined) || `drug-${Date.now()}-${Math.random()}`;
      const nameValue = (item.name || item.drugName || 'Unknown Drug').toString().trim();
      const priceRaw = item.unitPrice ?? item.standardUnitPrice ?? 0;
      return {
        id: idValue,
        name: nameValue,
        strength: (item.strength || 'Unknown Strength').toString().trim(),
        formulation: (item.formulation || 'Unknown Formulation').toString().trim(),
        payer: (item.payer || 'Unknown Payer').toString().trim(),
        unitPrice: this.parseUnitPrice(priceRaw)
      };
    });
  }

  /**
   * Parse unit price, handling different formats
   */
  private parseUnitPrice(price: any): number {
    if (typeof price === 'number') {
      return price;
    }
    
    if (typeof price === 'string') {
      // Remove currency symbols and commas
      const cleanPrice = price.replace(/[$,]/g, '');
      const parsed = parseFloat(cleanPrice);
      
      if (isNaN(parsed)) {
        throw new Error(`Invalid unit price format: ${price}`);
      }
      
      return parsed;
    }
    
    throw new Error(`Invalid unit price type: ${typeof price}`);
  }

  /**
   * Get cached reference drugs (if available)
   */
  getCachedReferenceDrugs(): Drug[] | null {
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }
    return null;
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Check if cache is valid
   */
  isCacheValid(): boolean {
    return this.cache !== null && Date.now() < this.cacheExpiry;
  }

  /**
   * Get cache status information
   */
  getCacheStatus(): {
    hasCache: boolean;
    isValid: boolean;
    expiresAt: Date | null;
    timeUntilExpiry: number | null;
  } {
    if (!this.cache) {
      return {
        hasCache: false,
        isValid: false,
        expiresAt: null,
        timeUntilExpiry: null
      };
    }

    const timeUntilExpiry = this.cacheExpiry - Date.now();
    
    return {
      hasCache: true,
      isValid: timeUntilExpiry > 0,
      expiresAt: new Date(this.cacheExpiry),
      timeUntilExpiry: timeUntilExpiry > 0 ? timeUntilExpiry : null
    };
  }

  /**
   * Refresh cache by fetching new data
   */
  async refreshCache(): Promise<Drug[]> {
    this.clearCache();
    return this.fetchReferenceDrugs();
  }

  /**
   * Search for drugs by name (case-insensitive)
   */
  searchDrugsByName(searchTerm: string): Drug[] {
    if (!this.cache) {
      return [];
    }

    const term = searchTerm.toLowerCase().trim();
    
    return this.cache.filter(drug => 
      drug.name.toLowerCase().includes(term) ||
      drug.strength.toLowerCase().includes(term) ||
      drug.formulation.toLowerCase().includes(term)
    );
  }

  /**
   * Get drugs by payer
   */
  getDrugsByPayer(payer: string): Drug[] {
    if (!this.cache) {
      return [];
    }

    const targetPayer = payer.toLowerCase().trim();
    
    return this.cache.filter(drug => 
      drug.payer.toLowerCase() === targetPayer
    );
  }

  /**
   * Get drugs by price range
   */
  getDrugsByPriceRange(minPrice: number, maxPrice: number): Drug[] {
    if (!this.cache) {
      return [];
    }

    return this.cache.filter(drug => 
      drug.unitPrice >= minPrice && drug.unitPrice <= maxPrice
    );
  }

  /**
   * Get statistics about reference drug data
   */
  getReferenceDataStats(): {
    totalDrugs: number;
    uniquePayers: string[];
    priceRange: { min: number; max: number; average: number };
    formulations: string[];
    strengths: string[];
  } {
    if (!this.cache || this.cache.length === 0) {
      return {
        totalDrugs: 0,
        uniquePayers: [],
        priceRange: { min: 0, max: 0, average: 0 },
        formulations: [],
        strengths: []
      };
    }

    const payers = new Set(this.cache.map(d => d.payer));
    const formulations = new Set(this.cache.map(d => d.formulation));
    const strengths = new Set(this.cache.map(d => d.strength));
    
    const prices = this.cache.map(d => d.unitPrice);
    const totalPrice = prices.reduce((sum, price) => sum + price, 0);
    
    return {
      totalDrugs: this.cache.length,
      uniquePayers: Array.from(payers),
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: totalPrice / this.cache.length
      },
      formulations: Array.from(formulations),
      strengths: Array.from(strengths)
    };
  }
}
