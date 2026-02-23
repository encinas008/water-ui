import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnDestroy, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import flatpickr from 'flatpickr';
import { LabelComponent } from '../label/label.component';

// Locale español para flatpickr
const SpanishLocale: flatpickr.CustomLocale = {
  weekdays: {
    shorthand: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    longhand: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
  },
  months: {
    shorthand: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    longhand: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  },
  rangeSeparator: " a ",
  weekAbbreviation: "Sem",
  scrollTitle: "Desplázate para aumentar",
  toggleTitle: "Click para alternar",
  amPM: ["AM", "PM"] as [string, string],
  yearAriaLabel: "Año",
  monthAriaLabel: "Mes",
  hourAriaLabel: "Hora",
  minuteAriaLabel: "Minuto",
  time_24hr: false
};

@Component({
  selector: 'app-date-picker',
  imports: [CommonModule, LabelComponent],
  templateUrl: './date-picker.component.html',
  styles: ``
})
export class DatePickerComponent implements AfterViewInit, OnDestroy, OnChanges {

  @Input() id!: string;
  @Input() mode: 'single' | 'multiple' | 'range' | 'time' = 'single';
  @Input() defaultDate?: string | Date | string[] | Date[];
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() dateFormat: string = 'Y-m-d'; // Formato por defecto: YYYY-MM-DD
  @Input() altFormat?: string; // Formato alternativo para mostrar (ej: 'd/m/Y')
  @Input() useAltInput: boolean = false; // Si usar input alternativo para mostrar formato diferente
  @Input() minDate?: string | Date; // Fecha mínima seleccionable
  @Input() maxDate?: string | Date; // Fecha máxima seleccionable
  @Input() disableDates?: string[] | Date[]; // Fechas deshabilitadas
  @Input() enableTime: boolean = false; // Habilitar selector de hora
  @Input() time24hr: boolean = false; // Formato de 24 horas
  @Input() locale: string = 'es'; // Locale por defecto: español
  @Input() firstDayOfWeek: number = 1; // Primer día de la semana (1 = Lunes)
  @Input() allowInput: boolean = true; // Permitir entrada manual de fecha
  @Input() clickOpens: boolean = true; // Abrir al hacer clic
  @Input() inline: boolean = false; // Mostrar calendario inline
  @Input() disabled: boolean = false; // Deshabilitar el componente
  @Output() dateChange = new EventEmitter<any>();

  @ViewChild('dateInput', { static: false }) dateInput!: ElementRef<HTMLInputElement>;

  private flatpickrInstance: flatpickr.Instance | undefined;

  ngAfterViewInit() {
    // Siempre usar español por defecto
    const localeConfig = SpanishLocale;

    const options: any = {
      mode: this.mode,
      static: !this.inline,
      monthSelectorType: 'static',
      dateFormat: this.dateFormat,
      defaultDate: this.defaultDate,
      locale: localeConfig, // Siempre usar español
      firstDayOfWeek: this.firstDayOfWeek,
      allowInput: this.allowInput,
      clickOpens: this.clickOpens,
      inline: this.inline,
      enableTime: this.enableTime,
      time_24hr: this.time24hr,
      onChange: (selectedDates: Date[], dateStr: string, instance: flatpickr.Instance) => {
        this.dateChange.emit({ selectedDates, dateStr, instance });
      }
    };

    // Fecha mínima
    if (this.minDate) {
      options.minDate = this.minDate;
    }

    // Fecha máxima
    if (this.maxDate) {
      options.maxDate = this.maxDate;
    }

    // Fechas deshabilitadas
    if (this.disableDates && this.disableDates.length > 0) {
      options.disable = this.disableDates;
    }

    // Si se especifica altFormat y useAltInput, usar input alternativo
    if (this.useAltInput && this.altFormat) {
      options.altInput = true;
      options.altFormat = this.altFormat;
      options.altInputClass = 'form-input'; // Clase CSS para el input alternativo
    }

    options.clickOpens = this.clickOpens && !this.disabled;

    this.flatpickrInstance = flatpickr(this.dateInput.nativeElement, options);

    if (this.disabled) {
      this.dateInput.nativeElement.disabled = true;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['defaultDate'] && this.flatpickrInstance && !changes['defaultDate'].firstChange) {
      this.setDate(changes['defaultDate'].currentValue);
    }
    if (changes['disabled'] && !changes['disabled'].firstChange) {
      this.updateDisabledState();
    }
  }

  private updateDisabledState(): void {
    if (this.dateInput?.nativeElement) {
      this.dateInput.nativeElement.disabled = this.disabled;
    }
  }

  ngOnDestroy() {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
    }
  }

  // Método público para actualizar la fecha programáticamente
  setDate(date: string | Date | Date[]): void {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.setDate(date, false);
    }
  }

  // Método público para limpiar la fecha
  clear(): void {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.clear();
    }
  }
}
