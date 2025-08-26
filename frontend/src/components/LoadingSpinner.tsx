import { Loader2, FileSearch, Database, CheckCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "Processing..." }: LoadingSpinnerProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: FileSearch, text: "Parsing invoice file...", duration: 1000 },
    { icon: Database, text: "Fetching reference data...", duration: 1000 },
    { icon: CheckCircle, text: "Validating drug information...", duration: 1000 },
    { icon: CheckCircle, text: "Generating report...", duration: 500 }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, steps[currentStep]?.duration || 1000);

    return () => clearInterval(interval);
  }, [currentStep, steps]);

  const getCurrentIcon = () => {
    const IconComponent = steps[currentStep]?.icon || Loader2;
    return <IconComponent className="h-6 w-6 animate-spin" />;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      <div className="flex items-center space-x-3">
        <div className="text-primary">
          {getCurrentIcon()}
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium">{message}</p>
          <p className="text-sm text-muted-foreground">
            {steps[currentStep]?.text || "Processing your request..."}
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex space-x-2">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground max-w-md text-center">
        This may take a few moments while we process your file and validate against our reference database.
      </p>
    </div>
  );
}