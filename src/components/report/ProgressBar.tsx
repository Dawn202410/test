import { cn } from '@/lib/utils';

interface StepItem {
  id: number;
  label: string;
}

interface ProgressBarProps {
  currentStep: number;
  steps?: StepItem[];
}

export default function ProgressBar({ currentStep, steps = [] }: ProgressBarProps) {
  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10 mx-16"></div>
        <div
          className="absolute top-5 h-1 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 -z-10 mx-16"
          style={{ 
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            left: '4rem',
            right: 'auto'
          }}
        ></div>
        
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all',
                currentStep >= step.id 
                  ? 'border-blue-100 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md'
                  : 'border-gray-100 bg-white text-gray-400'
              )}
            >
              {currentStep > step.id ? (
                <i className="fa-solid fa-check text-lg"></i>
              ) : (
                <span className="text-lg font-medium">{step.id}</span>
              )}
            </div>
            <span
              className={cn(
                'mt-3 text-sm font-medium',
                currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
