import { useRef, useLayoutEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { isValid, isPast, format, differenceInMilliseconds } from "date-fns";
import { getDeadlineInLocalTime } from '@/utils/dateUtils';

interface DeadlineStep {
  label: string;
  date: string;
  timezone?: string;
}

interface DeadlineProgressProps {
  steps: DeadlineStep[];
}

const DAYS_BEFORE_START = 30; // Number of days to extend the timeline before the first deadline

const DeadlineProgress = ({ steps }: DeadlineProgressProps) => {
  // Filter out TBD steps
  const validSteps = steps.filter(step => {
    const date = step.date !== 'TBD' ? getDeadlineInLocalTime(step.date, step.timezone) : null;
    return date && isValid(date);
  }).sort((a, b) => {
    // Sort steps by date to ensure proper progression
    const dateA = getDeadlineInLocalTime(a.date, a.timezone);
    const dateB = getDeadlineInLocalTime(b.date, b.timezone);
    if (!dateA || !dateB) return 0;
    return dateA.getTime() - dateB.getTime();
  });

  const barRef = useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = useState(0);

  useLayoutEffect(() => {
    if (barRef.current) {
      setBarWidth(barRef.current.offsetWidth);
    }
    // Update on window resize
    const handleResize = () => {
      if (barRef.current) setBarWidth(barRef.current.offsetWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (validSteps.length === 0) return null;

  const now = new Date();
  const singleDeadline = validSteps.length === 1;
  const firstStepDate = getDeadlineInLocalTime(validSteps[0].date, validSteps[0].timezone);
  const lastStepDate = singleDeadline 
    ? firstStepDate // Use same date for lastStepDate in single deadline case
    : getDeadlineInLocalTime(validSteps[validSteps.length - 1].date, validSteps[validSteps.length - 1].timezone);

  if (!firstStepDate || !lastStepDate || !isValid(firstStepDate) || !isValid(lastStepDate)) {
    return null;
  }

  // Calculate extended start date (30 days before first deadline)
  const extendedStartDate = new Date(firstStepDate.getTime() - (DAYS_BEFORE_START * 24 * 60 * 60 * 1000));

  // Calculate progress position in px with extended timeline
  let progressPx = 0;
  if (barWidth > 0) {
    const totalWidth = barWidth;
    const preDeadlineWidth = totalWidth * 0.2;
    const deadlineWidth = totalWidth * 0.8;

    if (now <= extendedStartDate) {
      progressPx = 0;
    } else if (now >= lastStepDate) {
      progressPx = totalWidth;
    } else if (singleDeadline) {
      // Special handling for single deadline
      const progress = (now.getTime() - extendedStartDate.getTime()) / 
                      (firstStepDate.getTime() - extendedStartDate.getTime());
      progressPx = Math.min(totalWidth, progress * totalWidth);
    } else if (now < firstStepDate) {
      // Calculate progress in pre-deadline period
      const progress = (now.getTime() - extendedStartDate.getTime()) / 
                      (firstStepDate.getTime() - extendedStartDate.getTime());
      progressPx = progress * preDeadlineWidth;
    } else {
      // Calculate progress in deadline period
      const progress = (now.getTime() - firstStepDate.getTime()) / 
                      (lastStepDate.getTime() - firstStepDate.getTime());
      progressPx = preDeadlineWidth + (progress * deadlineWidth);
    }
  }

  // Calculate step positions
  const stepPositions = validSteps.map(step => {
    const stepDate = getDeadlineInLocalTime(step.date, step.timezone);
    if (!stepDate || !isValid(stepDate)) return 0;

    if (singleDeadline) {
      // Place single deadline at the end
      return barWidth;
    } else {
      const preDeadlineWidth = barWidth * 0.2;
      const deadlineWidth = barWidth * 0.8;
      return preDeadlineWidth + 
             ((differenceInMilliseconds(stepDate, firstStepDate) / 
               differenceInMilliseconds(lastStepDate, firstStepDate)) * deadlineWidth);
    }
  });

  return (
    <div className="flex justify-center w-full my-4">
      <div className="relative w-full max-w-xl px-2">
        <div ref={barRef} className="relative w-full h-2 bg-neutral-200 rounded-full mx-auto">
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 h-2 bg-primary rounded-full transition-all"
            style={{ width: `${progressPx}px`, zIndex: 1 }}
          />
          
          {/* Extended start marker */}
          {extendedStartDate && (
            <div
              className="absolute"
              style={{
                left: 0,
                top: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 2
              }}
            >
              <div className="w-3 h-3 bg-neutral-100 rounded-full border-2 border-neutral-300" />
              <span 
                className="absolute whitespace-nowrap text-[10px] text-neutral-600"
                style={{
                  top: "-24px",
                  transform: "rotate(-45deg)",
                  transformOrigin: "left bottom",
                  left: "10px"
                }}
              >
                Start
              </span>
            </div>
          )}

          {/* Step markers */}
          {validSteps.map((step, idx) => {
            const stepDate = getDeadlineInLocalTime(step.date, step.timezone);
            const status = stepDate && isPast(stepDate) ? 'past' : 'upcoming';
            const localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const leftPx = stepPositions[idx];
            const dateLabel = stepDate ? format(stepDate, "MMM d") : 'TBD';

            return (
              <TooltipProvider key={step.label + idx}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute flex flex-col items-center"
                      style={{
                        left: `${leftPx}px`,
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 2,
                        cursor: "pointer"
                      }}
                    >
                      {/* Date label above - now diagonal */}
                      <span 
                        className="absolute whitespace-nowrap text-[10px] text-neutral-600"
                        style={{
                          top: "-24px",
                          transform: "rotate(-45deg)",
                          transformOrigin: "left bottom",
                          left: "10px" // Offset to prevent overlap with dot
                        }}
                      >
                        {dateLabel}
                      </span>

                      {/* Step marker dot */}
                      <div
                        className={`w-4 h-4 rounded-full ${
                          status === 'past' 
                            ? 'bg-primary border-2 border-primary'
                            : 'bg-neutral-200 border-2 border-neutral-300' 
                        }`}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{step.label}</p>
                    <p>{stepDate ? format(stepDate, "MMMM d, yyyy") : 'TBD'}</p>
                    <p className="text-xs text-neutral-500">Timezone: {step.timezone || localTZ}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}

          {/* Today marker */}
          {progressPx > 0 && progressPx < barWidth && (
            <div
              className="absolute"
              style={{
                left: `${progressPx}px`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 3
              }}
            >
              <div className="w-3 h-3 bg-white rounded-full border-2 border-primary shadow-sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeadlineProgress;