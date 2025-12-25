import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { TextAreaComponent } from '../../shared/components/form/input/text-area.component';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { JobService } from '../../shared/services/job.service';
import { JobInputDto, JobUpdateDto } from '../../shared/models/water-system.models';

@Component({
  selector: 'app-add-job',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    LabelComponent,
    InputFieldComponent,
    TextAreaComponent,
    DatePickerComponent,
    ButtonComponent
  ],
  providers: [DatePipe],
  templateUrl: './add-job.component.html',
  styles: ``
})
export class AddJobComponent implements OnInit {
  // Form fields
  name: string = '';
  startDate: string = ''; // Formato DD/MM/YYYY para mostrar (deprecated, usar startDateDisplay)
  startDateDisplay: string = ''; // Formato "Jun 15, 2015" para mostrar
  startDateBackend: string = ''; // Formato YYYY-MM-DD para backend
  startDateObject: Date = new Date(); // Date object para el date picker
  description: string = '';
  fine: string | number = '';

  // UI State
  isLoading: boolean = false;
  showAlert: boolean = false;
  alertType: 'success' | 'error' | 'warning' | 'info' = 'success';
  alertMessage: string = '';

  // Edit mode
  isEditMode: boolean = false;
  jobId: string | null = null;

  constructor(
    private jobService: JobService,
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe
  ) {
    // Establecer fecha actual por defecto
    const today = new Date();
    this.startDateObject = today;
    this.startDate = this.formatDateToDDMMYYYY(today);
    this.startDateDisplay = this.formatDateToMMMDYYYY(today);
    this.startDateBackend = this.formatDateToYYYYMMDDFromDate(today);
  }

  // Convertir fecha a formato "Jun 15, 2015" en español "Jun 15, 2015" -> "Jun 15, 2015"
  formatDateToMMMDYYYY(date: Date | string): string {
    let dateObj: Date;
    if (typeof date === 'string') {
      // Si viene del backend en formato YYYY-MM-DD
      const parts = date.split('-');
      dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      dateObj = date;
    }
    
    // Meses en español abreviados
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
      // Si viene del backend en formato YYYY-MM-DD
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

  // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD
  formatDateToYYYYMMDD(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr; // Si no es formato DD/MM/YYYY, retornar tal cual
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }

  // Convertir fecha de DD/MM/YYYY a Date object
  parseDDMMYYYYToDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Los meses en JS son 0-indexed
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  ngOnInit(): void {
    // Verificar si estamos en modo edición
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.isEditMode = true;
        this.jobId = id;
        this.loadJob(id);
      }
    });
  }

  loadJob(id: string): void {
    this.isLoading = true;
    this.jobService.getJobById(id).subscribe({
      next: (job) => {
        this.name = job.name;
        // Convertir fecha del backend (YYYY-MM-DD) a formato de visualización
        this.startDate = this.formatDateToDDMMYYYY(job.startDate);
        this.startDateBackend = job.startDate;
        // Crear Date object para el date picker
        const dateParts = job.startDate.split('-');
        const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        this.startDateObject = dateObj;
        this.startDateDisplay = this.formatDateToMMMDYYYY(dateObj);
        this.description = job.description || '';
        this.fine = job.fine?.toString() || '';
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al cargar trabajo:', error);
        this.showAlertMessage('Error al cargar el trabajo', 'error');
      }
    });
  }

  validateForm(): boolean {
    if (!this.name || this.name.trim() === '') {
      this.showAlertMessage('Por favor ingrese el nombre del trabajo', 'error');
      return false;
    }

    if (!this.startDate || !this.startDateBackend) {
      this.showAlertMessage('Por favor seleccione la fecha de inicio', 'error');
      return false;
    }

    // Validar formato de fecha DD/MM/YYYY
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(this.startDate)) {
      this.showAlertMessage('Por favor ingrese una fecha válida en formato DD/MM/YYYY', 'error');
      return false;
    }

    return true;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    if (this.isEditMode && this.jobId) {
      // Actualizar trabajo existente
            const jobUpdate: JobUpdateDto = {
              name: this.name,
              startDate: this.startDateBackend, // Usar formato YYYY-MM-DD para backend
              description: this.description || undefined,
              fine: this.fine ? (typeof this.fine === 'string' ? parseFloat(this.fine) : this.fine) : undefined
            };

      const id = this.jobId; // Guardar en variable local para TypeScript
      this.jobService.updateJob(id, jobUpdate).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showAlertMessage('Trabajo actualizado exitosamente', 'success');
          
          // Redirigir después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/jobs']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error al actualizar trabajo:', error);
          this.handleError(error);
        }
      });
    } else {
      // Crear nuevo trabajo
            const jobInput: JobInputDto = {
              name: this.name,
              startDate: this.startDateBackend, // Usar formato YYYY-MM-DD para backend
              description: this.description || undefined,
              fine: this.fine ? (typeof this.fine === 'string' ? parseFloat(this.fine) : this.fine) : undefined
            };

      this.jobService.createJob(jobInput).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showAlertMessage('Trabajo creado exitosamente', 'success');
          
          // Resetear formulario después de 2 segundos
          setTimeout(() => {
            this.resetForm();
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error al crear trabajo:', error);
          this.handleError(error);
        }
      });
    }
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
    
    this.showAlertMessage(userMessage, 'error');
  }

  onCancel(): void {
    this.router.navigate(['/jobs']);
  }

  resetForm(): void {
    this.name = '';
    const today = new Date();
    this.startDateObject = today;
    this.startDate = this.formatDateToDDMMYYYY(today);
    this.startDateDisplay = this.formatDateToMMMDYYYY(today);
    this.startDateBackend = this.formatDateToYYYYMMDDFromDate(today);
    this.description = '';
    this.fine = '';
    this.showAlert = false;
  }

  onDateChange(event: any): void {
    // El evento viene de flatpickr con dateStr en formato "M j, Y" (ej: "6 15, 2015")
    if (event && event.selectedDates && event.selectedDates.length > 0) {
      const selectedDate = event.selectedDates[0];
      this.startDateObject = selectedDate;
      // Formatear para mostrar "Jun 15, 2015"
      this.startDateDisplay = this.formatDateToMMMDYYYY(selectedDate);
      // Convertir a formato YYYY-MM-DD para el backend
      this.startDateBackend = this.formatDateToYYYYMMDDFromDate(selectedDate);
      // Mantener compatibilidad con formato antiguo
      this.startDate = this.formatDateToDDMMYYYY(selectedDate);
    } else if (event && event.dateStr) {
      // Fallback: si solo tenemos dateStr, intentar parsearlo
      const dateObj = this.parseMMMDYYYYToDate(event.dateStr);
      if (dateObj) {
        this.startDateObject = dateObj;
        this.startDateDisplay = this.formatDateToMMMDYYYY(dateObj);
        this.startDateBackend = this.formatDateToYYYYMMDDFromDate(dateObj);
        this.startDate = this.formatDateToDDMMYYYY(dateObj);
      }
    }
  }

  // Parsear fecha en formato "M j, Y" (ej: "6 15, 2015") a Date
  parseMMMDYYYYToDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    // Formato puede ser "M j, Y" o "MM j, Y" o "M jj, Y"
    const parts = dateStr.split(',');
    if (parts.length !== 2) return null;
    const year = parseInt(parts[1].trim(), 10);
    const monthDay = parts[0].trim().split(' ');
    if (monthDay.length !== 2) return null;
    const month = parseInt(monthDay[0], 10) - 1; // Los meses en JS son 0-indexed
    const day = parseInt(monthDay[1], 10);
    return new Date(year, month, day);
  }

  // Convertir Date object a YYYY-MM-DD
  formatDateToYYYYMMDDFromDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  showAlertMessage(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
  }

  closeAlert(): void {
    this.showAlert = false;
  }
}

