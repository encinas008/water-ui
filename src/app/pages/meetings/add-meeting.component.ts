import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { TextAreaComponent } from '../../shared/components/form/input/text-area.component';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { MeetingService } from '../../shared/services/meeting.service';
import { MeetingTypeService } from '../../shared/services/meeting-type.service';
import { MeetingInputDto, MeetingUpdateDto, MeetingTypeOutputDto } from '../../shared/models/water-system.models';
import { Subscription } from 'rxjs';
import { toast } from 'ngx-sonner';
import { NumberLimitDirective } from '../../shared/directives/number-limit.directive';

@Component({
  selector: 'app-add-meeting',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    LabelComponent,
    InputFieldComponent,
    TextAreaComponent,
    DatePickerComponent,
    ButtonComponent,
    NumberLimitDirective
  ],
  providers: [DatePipe],
  templateUrl: './add-meeting.component.html',
  styles: ``
})
export class AddMeetingComponent implements OnInit, OnDestroy {
  // Form fields
  name: string = '';
  meetingDate: string = ''; // Formato DD/MM/YYYY para mostrar (deprecated)
  meetingDateDisplay: string = ''; // Formato "Jun 15, 2015" para mostrar
  meetingDateBackend: string = ''; // Formato YYYY-MM-DD para backend
  meetingDateObject: Date = new Date(); // Date object para el date picker

  // Hora
  hour: number = 12; // 1-12
  minute: number = 0; // 0-59
  amPm: string = 'PM'; // 'AM' o 'PM'

  // Tipo de reunión
  meetingTypeCode: string = '';
  meetingTypes: MeetingTypeOutputDto[] = [];

  description: string = '';
  fine: string | number = '';
  waitingMinutes: number = 15;
  waitingMinutesOptions: number[] = [10, 15, 20, 30];

  // UI State
  isLoading: boolean = false;

  // Edit mode
  isEditMode: boolean = false;
  meetingId: string | null = null;
  private routeSubscription: Subscription = new Subscription();

  // Opciones para selectores
  hours: number[] = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
  minutes: number[] = [0, 15, 30, 45]; // Solo intervalos de 15 minutos
  amPmOptions: string[] = ['AM', 'PM'];

  // Fecha mínima (hoy) para bloquear fechas pasadas
  minDate: Date = new Date();

  constructor(
    private meetingService: MeetingService,
    private meetingTypeService: MeetingTypeService,
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe
  ) {
    // Establecer fecha actual por defecto
    const today = new Date();
    this.meetingDateObject = today;
    this.meetingDate = this.formatDateToDDMMYYYY(today);
    this.meetingDateDisplay = this.formatDateToMMMDYYYY(today);
    this.meetingDateBackend = this.formatDateToYYYYMMDDFromDate(today);
    // Establecer minDate como hoy (sin horas, minutos, segundos)
    this.minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  ngOnInit(): void {
    // Cargar tipos de reunión
    this.loadMeetingTypes();

    // Verificar si estamos en modo edición
    this.routeSubscription.add(
      this.route.params.subscribe(params => {
        const id = params['id'];
        if (id) {
          this.isEditMode = true;
          this.meetingId = id;
          this.loadMeeting(id);
        }
      })
    );
  }

  loadMeetingTypes(): void {
    this.meetingTypeService.getMeetingTypes().subscribe({
      next: (types) => {
        this.meetingTypes = types;
      },
      error: (error) => {
        console.error('Error al cargar tipos de reunión:', error);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  // Convertir fecha a formato "Jun 15, 2015"
  formatDateToMMMDYYYY(date: Date | string): string {
    let dateObj: Date;
    if (typeof date === 'string') {
      const parts = date.split('-');
      dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      dateObj = date;
    }
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = months[dateObj.getMonth()];
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    return `${month} ${day}, ${year}`;
  }

  // Convertir fecha de YYYY-MM-DD a DD/MM/YYYY
  formatDateToDDMMYYYY(date: Date | string): string {
    let dateObj: Date;
    if (typeof date === 'string') {
      const parts = date.split('-');
      dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      dateObj = date;
    }
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Convertir Date object a YYYY-MM-DD
  formatDateToYYYYMMDDFromDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadMeeting(id: string): void {
    this.isLoading = true;
    this.meetingService.getMeetingById(id).subscribe({
      next: (meeting) => {
        this.name = meeting.name;
        this.meetingDateBackend = meeting.meetingDate;
        const dateParts = meeting.meetingDate.split('-');
        const meetingDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

        this.meetingDateObject = meetingDate;
        this.meetingDate = this.formatDateToDDMMYYYY(this.meetingDateObject);
        this.meetingDateDisplay = this.formatDateToMMMDYYYY(this.meetingDateObject);
        this.hour = meeting.hour;
        this.minute = meeting.minute;
        this.amPm = meeting.amPm;
        this.meetingTypeCode = meeting.meetingTypeCode || '';
        this.description = meeting.description || '';
        this.fine = meeting.fine?.toString() || '';
        this.waitingMinutes = meeting.waitingMinutes || 0;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al cargar reunión:', error);
        toast.error('Error al cargar la reunión');
      }
    });
  }

  onFineChange(value: any): void {
    this.fine = value;
  }

  get isFormValid(): boolean {
    // Nombre obligatorio
    if (!this.name || this.name.trim() === '') return false;

    // Fecha obligatoria
    if (!this.meetingDateBackend) return false;

    // Tipo de reunión obligatorio
    if (!this.meetingTypeCode) return false;

    // Multa obligatoria y válida (mínimo 1, máximo 9999999.99)
    if (this.fine === null || this.fine === undefined || this.fine.toString().trim() === '') return false;
    const fineValue = typeof this.fine === 'string' ? parseFloat(this.fine) : this.fine;
    if (isNaN(fineValue) || fineValue < 1 || fineValue > 9999999.99) return false;

    // Hora válida (reglas de negocio AM/PM)
    if (this.isInvalidTime()) return false;

    return true;
  }

  validateForm(): boolean {
    if (!this.name || this.name.trim() === '') {
      toast.error('Por favor ingrese el nombre de la reunión');
      return false;
    }

    if (!this.meetingDateBackend) {
      toast.error('Por favor seleccione la fecha de la reunión');
      return false;
    }

    if (!this.meetingTypeCode) {
      toast.error('Por favor seleccione el tipo de reunión');
      return false;
    }

    if (this.fine === null || this.fine === undefined || this.fine.toString().trim() === '') {
      toast.error('Por favor ingrese el monto de la multa');
      return false;
    }

    const fineValue = typeof this.fine === 'string' ? parseFloat(this.fine) : this.fine;
    if (isNaN(fineValue) || fineValue < 0) {
      toast.error('La multa debe ser un número válido mayor o igual a 0');
      return false;
    }

    if (this.hour < 1 || this.hour > 12) {
      toast.error('La hora debe estar entre 1 y 12');
      return false;
    }

    if (this.minute < 0 || this.minute > 59) {
      toast.error('El minuto debe estar entre 0 y 59');
      return false;
    }

    if (this.amPm !== 'AM' && this.amPm !== 'PM') {
      toast.error('Debe seleccionar AM o PM');
      return false;
    }

    // Validar que no sea horario de madrugada (12 AM - 6 AM)
    if (this.amPm === 'AM') {
      if (this.hour === 12 || (this.hour >= 1 && this.hour <= 6)) {
        toast.error('No se permiten reuniones entre 12 AM y 6 AM');
        return false;
      }
    }

    // Validar que en PM solo se permitan horas de 1 PM a 8 PM
    if (this.amPm === 'PM') {
      if (this.hour < 1 || this.hour > 8) {
        toast.error('En PM solo se permiten reuniones de 1 PM a 8 PM');
        return false;
      }
    }

    return true;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    if (this.isEditMode && this.meetingId) {
      // Actualizar reunión existente
      const id = this.meetingId;
      const meetingUpdate: MeetingUpdateDto = {
        name: this.name,
        meetingDate: this.meetingDateBackend,
        hour: this.hour,
        minute: this.minute,
        amPm: this.amPm,
        meetingTypeCode: this.meetingTypeCode || undefined,
        description: this.description || undefined,
        fine: this.fine ? (typeof this.fine === 'string' ? parseFloat(this.fine) : this.fine) : 0,
        waitingMinutes: this.waitingMinutes || 0
      };

      this.meetingService.updateMeeting(id, meetingUpdate).subscribe({
        next: (response) => {
          this.isLoading = false;
          toast.success('Reunión actualizada exitosamente');
          this.router.navigate(['/meetings']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error al actualizar reunión:', error);
          this.handleError(error);
        }
      });
    } else {
      // Crear nueva reunión
      const meetingInput: MeetingInputDto = {
        name: this.name,
        meetingDate: this.meetingDateBackend,
        hour: this.hour,
        minute: this.minute,
        amPm: this.amPm,
        meetingTypeCode: this.meetingTypeCode || undefined,
        description: this.description || undefined,
        fine: this.fine ? (typeof this.fine === 'string' ? parseFloat(this.fine) : this.fine) : 0,
        waitingMinutes: this.waitingMinutes || 0
      };

      this.meetingService.createMeeting(meetingInput).subscribe({
        next: (response) => {
          this.isLoading = false;
          toast.success('Reunión creada exitosamente');
          this.router.navigate(['/meetings']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error al crear reunión:', error);
          this.handleError(error);
        }
      });
    }
  }

  onNameInput(event: any): void {
    let value = event?.target ? event.target.value : event;
    if (typeof value !== 'string') value = value?.toString() || '';

    // Normalizar espacios (reemplazar múltiples por uno, quitar inicial)
    value = value.replace(/\s+/g, ' ').replace(/^\s+/, '');

    // Convertir a mayúsculas
    value = value.toUpperCase();

    // Sincronizar con el modelo y el input
    this.name = value;
    if (event?.target) event.target.value = value;
  }

  handleError(error: any): void {
    let userMessage = '';

    if (error.status === 0) {
      userMessage = 'No se puede conectar al servidor.';
    } else if (error.status === 401) {
      userMessage = 'Se requiere autenticación. Por favor inicia sesión primero.';
    } else if (error.status === 403) {
      userMessage = 'No tienes permisos para realizar esta acción.';
    } else if (error.status === 404) {
      userMessage = 'Recurso no encontrado.';
    } else if (error.status === 400) {
      userMessage = `Datos inválidos: ${error.error?.message || 'Verifica los datos ingresados'}`;
    } else if (error.status === 422) {
      userMessage = `Error de validación: ${error.error?.message || 'Revisa los campos del formulario'}`;
    } else if (error.status === 500) {
      userMessage = 'Error interno del servidor. Contacta al administrador.';
    } else {
      userMessage = `Error ${error.status}: ${error.error?.message || error.statusText || 'Error desconocido'}`;
    }

    toast.error(userMessage);
  }

  onCancel(): void {
    this.router.navigate(['/meetings']);
  }

  resetForm(): void {
    this.name = '';
    const today = new Date();
    this.meetingDateObject = today;
    this.meetingDate = this.formatDateToDDMMYYYY(today);
    this.meetingDateBackend = this.formatDateToYYYYMMDDFromDate(today);
    this.meetingDateDisplay = this.formatDateToMMMDYYYY(today);
    this.hour = 12;
    this.minute = 0;
    this.amPm = 'PM';
    this.meetingTypeCode = '';
    this.description = '';
    this.fine = '';
    this.waitingMinutes = 0;
  }



  onDateChange(event: any): void {
    if (event && event.selectedDates && event.selectedDates.length > 0) {
      const selectedDate = event.selectedDates[0];
      this.meetingDateObject = selectedDate;
      this.meetingDateBackend = this.formatDateToYYYYMMDDFromDate(selectedDate);
      this.meetingDateDisplay = this.formatDateToMMMDYYYY(selectedDate);
    } else {
      this.meetingDateObject = new Date();
      this.meetingDateBackend = '';
      this.meetingDateDisplay = '';
    }
  }

  formatMinute(minute: number): string {
    return String(minute).padStart(2, '0');
  }

  // Verificar si la hora seleccionada es inválida
  isInvalidTime(): boolean {
    if (this.amPm === 'AM') {
      // En AM, bloquear 12 AM - 6 AM
      return this.hour === 12 || (this.hour >= 1 && this.hour <= 6);
    } else if (this.amPm === 'PM') {
      // En PM, bloquear fuera de 1 PM - 8 PM
      return this.hour < 1 || this.hour > 8;
    }
    return false;
  }

  // Verificar si una hora específica está deshabilitada
  isHourDisabled(hour: number): boolean {
    if (this.amPm === 'AM') {
      // En AM, deshabilitar 12 AM - 6 AM
      return hour === 12 || (hour >= 1 && hour <= 6);
    } else if (this.amPm === 'PM') {
      // En PM, deshabilitar fuera de 1 PM - 8 PM
      return hour < 1 || hour > 8;
    }
    return false;
  }

  // Obtener horas disponibles según AM/PM seleccionado
  getAvailableHours(): number[] {
    if (this.amPm === 'AM') {
      // En AM, solo permitir 7, 8, 9, 10, 11
      return [7, 8, 9, 10, 11];
    } else if (this.amPm === 'PM') {
      // En PM, solo permitir 1, 2, 3, 4, 5, 6, 7, 8
      return [1, 2, 3, 4, 5, 6, 7, 8];
    }
    return this.hours;
  }

  // Cuando cambia la hora o AM/PM, ajustar si es necesario
  onHourOrAmPmChange(): void {
    if (this.isInvalidTime()) {
      // Si la hora seleccionada es inválida, cambiar a una válida
      if (this.amPm === 'AM') {
        // Si es AM y está en rango inválido, cambiar a 7 AM
        if (this.hour === 12 || (this.hour >= 1 && this.hour <= 6)) {
          this.hour = 7;
        }
      } else if (this.amPm === 'PM') {
        // Si es PM y está fuera de rango, cambiar a 1 PM o 8 PM según corresponda
        if (this.hour < 1) {
          this.hour = 1;
        } else if (this.hour > 8) {
          this.hour = 8;
        }
      }
    }
  }
}

