import React, { memo } from 'react'

const StepIndicator = memo(function StepIndicator({ steps = 3, activeStep = 1, completedSteps = [], className = '' }) {
    const stepLabels = [
        { key: 1, label: 'Upload' },
        { key: 2, label: 'Mapping' },
        { key: 3, label: 'Review' },
    ]

    return (
        <div className={`flex items-center justify-center gap-2 ${className}`}>
            {stepLabels.map((step, idx) => {
                const stepNum = idx + 1
                const isCompleted = completedSteps.includes(stepNum)
                const isActive = stepNum === activeStep
                const isPast = stepNum < activeStep

                return (
                    <div key={stepNum} className="flex items-center">
                        <div className="relative flex flex-col items-center">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center
                                transition-all duration-200
                                ${isCompleted ? 'bg-emerald-500 text-white border-emerald-500'
                                    : isActive ? 'bg-blue-500 text-white border-blue-500 ring-2 ring-blue-500/30'
                                    : 'bg-white text-gray-400 border-gray-300'
                                }
                            `} style={{ borderWidth: 2 }}>
                                {isCompleted ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <span className="text-sm font-medium">{stepNum}</span>
                                )}
                            </div>
                            <span className={`mt-1 text-xs font-medium ${isActive ? 'text-blue-600' : isPast ? 'text-gray-600' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>
                        {stepNum < steps && (
                            <div className={`
                                w-12 h-0.5 mx-2
                                ${isCompleted ? 'bg-emerald-500' : isPast ? 'bg-gray-300' : 'bg-gray-200'}
                            `} />
                        )}
                    </div>
                )
            })}
        </div>
    )
})

StepIndicator.displayName = 'StepIndicator'

export default StepIndicator