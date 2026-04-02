'use client'

import { cn } from '@/lib/utils'

interface ScheduleSelectorProps {
  preferredDays: string | null
  preferredTime: string | null
  onChange: (days: string, time: string) => void
}

const DAYS = [
  { id: 'Lunes', label: 'L', fullLabel: 'Lunes' },
  { id: 'Martes', label: 'M', fullLabel: 'Martes' },
  { id: 'Miércoles', label: 'X', fullLabel: 'Miércoles' },
  { id: 'Jueves', label: 'J', fullLabel: 'Jueves' },
  { id: 'Viernes', label: 'V', fullLabel: 'Viernes' },
  { id: 'Sábado', label: 'S', fullLabel: 'Sábado' },
]

const TIMES = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
]

export function ScheduleSelector({ preferredDays, preferredTime, onChange }: ScheduleSelectorProps) {
  const selectedDays = preferredDays ? preferredDays.split(',').filter(Boolean) : []
  const selectedTime = preferredTime || ''

  const toggleDay = (day: string) => {
    let newDays: string[]
    if (selectedDays.includes(day)) {
      newDays = selectedDays.filter(d => d !== day)
    } else {
      newDays = [...selectedDays, day]
    }
    onChange(newDays.join(','), selectedTime)
  }

  const setTime = (time: string) => {
    onChange(selectedDays.join(','), time)
  }

  return (
    <div className="space-y-4">
      {/* Days selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Días de asistencia</label>
        <div className="flex gap-2">
          {DAYS.map((day) => {
            const isSelected = selectedDays.includes(day.id)
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleDay(day.id)}
                className={cn(
                  'relative flex-1 h-12 rounded-xl text-sm font-medium transition-all duration-200',
                  'border-2 hover:scale-105',
                  isSelected
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300 hover:bg-cyan-50'
                )}
                style={isSelected ? { background: '#005691' } : {}}
                title={day.fullLabel}
              >
                <span className="relative z-10">{day.label}</span>
                {isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white opacity-75" />
                )}
              </button>
            )
          })}
        </div>
        {selectedDays.length > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            Seleccionados: {selectedDays.join(', ')}
          </p>
        )}
      </div>

      {/* Time selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Horario preferido</label>
        <div className="grid grid-cols-4 gap-2">
          {TIMES.map((time) => {
            const isSelected = selectedTime === time
            return (
              <button
                key={time}
                type="button"
                onClick={() => setTime(time)}
                className={cn(
                  'h-10 rounded-lg text-sm font-medium transition-all duration-200',
                  'border-2',
                  isSelected
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-transparent shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:bg-amber-50'
                )}
              >
                {time}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick presets */}
      <div className="pt-2">
        <label className="text-xs font-medium text-slate-500 mb-2 block">Configuración rápida</label>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Lun y Mié 18:00', days: 'Lunes,Miércoles', time: '18:00' },
            { label: 'Mar y Jue 18:00', days: 'Martes,Jueves', time: '18:00' },
            { label: 'Lun a Vie 7:00', days: 'Lunes,Martes,Miércoles,Jueves,Viernes', time: '07:00' },
            { label: 'Lun a Vie 18:00', days: 'Lunes,Martes,Miércoles,Jueves,Viernes', time: '18:00' },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.days, preset.time)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-full transition-all duration-200',
                'bg-slate-100 text-slate-600 hover:bg-slate-200',
                selectedDays.join(',') === preset.days && selectedTime === preset.time
                  && 'bg-slate-800 text-white'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {(selectedDays.length > 0 || selectedTime) && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-sm text-slate-700 font-medium">
            {selectedDays.length > 0 
              ? `${selectedDays.join(', ')} a las ${selectedTime || '(seleccionar horario)'}`
              : 'Selecciona los días de asistencia'
            }
          </p>
        </div>
      )}
    </div>
  )
}
