interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

export default function ProgressIndicator({ currentStep, totalSteps, stepLabels }: ProgressIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {stepLabels.map((label, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index < currentStep
                  ? "bg-purple-600 text-white"
                  : index === currentStep
                    ? "bg-purple-100 text-purple-600 border-2 border-purple-600"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {index + 1}
            </div>
            <span className={`text-xs mt-2 ${index <= currentStep ? "text-purple-600" : "text-gray-500"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}
