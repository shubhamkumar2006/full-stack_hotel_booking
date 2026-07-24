import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  selected,
  onSelect,
  mode = "single",
  disabledDates = [],
  minDate,
  maxDate,
  ...props
}) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    if (selected) {
      if (selected.from && (selected.from instanceof Date || !isNaN(new Date(selected.from).getTime()))) {
        return new Date(selected.from);
      }
      if (selected instanceof Date || (typeof selected === "string" && !isNaN(new Date(selected).getTime()))) {
        return new Date(selected);
      }
    }
    return new Date();
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const days = []
  let day = startDate

  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }

  const handleDayClick = (clickedDay) => {
    if (!onSelect) return

    if (mode === "single") {
      onSelect(clickedDay)
    } else if (mode === "range") {
      const { from, to } = selected || {}
      if (!from || (from && to)) {
        onSelect({ from: clickedDay, to: null })
      } else if (from && !to) {
        if (isBefore(clickedDay, from)) {
          onSelect({ from: clickedDay, to: null })
        } else {
          onSelect({ from, to: clickedDay })
        }
      }
    }
  }

  const isDisabled = (day) => {
    const today = startOfDay(new Date())
    if (minDate && isBefore(day, startOfDay(minDate))) return true
    if (maxDate && isAfter(day, startOfDay(maxDate))) return true
    if (disabledDates.some((d) => isSameDay(d, day))) return true
    return false
  }

  const isSelectedDay = (day) => {
    if (!selected) return false
    if (mode === "single") return isSameDay(selected, day)
    if (mode === "range") {
      const { from, to } = selected
      if (from && isSameDay(from, day)) return true
      if (to && isSameDay(to, day)) return true
      if (from && to && isAfter(day, from) && isBefore(day, to)) return true
    }
    return false
  }

  const isRangeStart = (day) => selected?.from && isSameDay(selected.from, day)
  const isRangeEnd = (day) => selected?.to && isSameDay(selected.to, day)
  const isRangeMiddle = (day) =>
    selected?.from && selected?.to && isAfter(day, selected.from) && isBefore(day, selected.to)

  return (
    <div className={cn("p-4 bg-card rounded-2xl border border-border w-fit select-none", className)} {...props}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-4">
        <h3 className="text-sm font-semibold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-7 w-7 rounded-lg")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-7 w-7 rounded-lg")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground pb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="w-9 h-9 flex items-center justify-center">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((d, i) => {
          const isCurrentMonth = isSameMonth(d, currentMonth)
          const disabled = isDisabled(d)
          const selectedDay = isSelectedDay(d)
          const rangeStart = isRangeStart(d)
          const rangeEnd = isRangeEnd(d)
          const rangeMiddle = isRangeMiddle(d)

          return (
            <button
              key={i}
              type="button"
              disabled={disabled || !isCurrentMonth}
              onClick={() => handleDayClick(d)}
              className={cn(
                "w-9 h-9 text-xs font-medium rounded-lg flex items-center justify-center transition-colors relative",
                !isCurrentMonth && "text-muted-foreground/30 pointer-events-none",
                isCurrentMonth && !disabled && !selectedDay && "hover:bg-accent hover:text-accent-foreground text-foreground",
                disabled && "text-muted-foreground/30 line-through cursor-not-allowed",
                selectedDay && "bg-primary text-primary-foreground font-semibold shadow-md",
                rangeStart && "rounded-r-none bg-primary text-primary-foreground",
                rangeEnd && "rounded-l-none bg-primary text-primary-foreground",
                rangeMiddle && "bg-primary/20 text-primary-300 rounded-none"
              )}
            >
              {format(d, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { Calendar }
