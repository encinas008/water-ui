import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { TextAreaComponent } from '../../shared/components/form/input/text-area.component';
import { JobService } from '../../shared/services/job.service';
import { AttendanceService } from '../../shared/services/attendance.service';
import { JobOutputDto, PartnerAssignmentInfoDto, AttendanceOutputDto, BulkAttendanceInputDto, PartnerAttendanceDto } from '../../shared/models/water-system.models';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-job-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    ButtonComponent,
    BadgeComponent,
    DatePickerComponent,
    InputFieldComponent,
    TextAreaComponent
  ],
  providers: [DatePipe],
  templateUrl: './job-attendance.component.html',
  styles: ``
})
export class JobAttendanceComponent implements OnInit {
  jobId: string = '';
  job: JobOutputDto | null = null;
  assignedPartners: PartnerAssignmentInfoDto[] = [];
  filteredPartners: PartnerAssignmentInfoDto[] = [];
  attendanceRecords: AttendanceOutputDto[] = [];

  selectedDate: Date = new Date();
  selectedDateStr: string = '';

  // Búsqueda
  searchQuery: string = '';

  // Estado de asistencia por socio
  partnerAttendanceMap: Map<string, {
    present: boolean;
    checkInTime: string;
    checkOutTime: string;
  }> = new Map();

  isLoading: boolean = false;
  isSaving: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobService: JobService,
    private attendanceService: AttendanceService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.jobId = params['id'];
      if (this.jobId) {
        this.loadJob();
        this.loadAssignedPartners();
        this.formatSelectedDate();
        this.loadAttendanceForDate();
      }
    });
  }

  loadJob(): void {
    this.jobService.getJobById(this.jobId).subscribe({
      next: (job) => {
        this.job = job;
        // Si el trabajo tiene fecha de inicio, usarla como fecha seleccionada por defecto
        if (this.job.startDate) {
          this.selectedDateStr = this.job.startDate;
          // Crear fecha en zona horaria local para el date picker (agregando hora para evitar problemas de TZ)
          this.selectedDate = new Date(this.job.startDate + 'T00:00:00');
          // Recargar asistencia para la fecha correcta del trabajo
          this.loadAttendanceForDate();
        }
      },
      error: (error) => {
        console.error('Error al cargar trabajo:', error);
        toast.error('Error al cargar el trabajo');
      }
    });
  }

  loadAssignedPartners(): void {
    this.isLoading = true;
    this.attendanceService.getJobWithPartnerAssignments(this.jobId).subscribe({
      next: (data) => {
        this.assignedPartners = data.assignedPartners.filter(p => p.isAssigned);
        this.applySearchFilter();
        this.initializeAttendanceMap();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al cargar socios asignados:', error);
        toast.error('Error al cargar los socios asignados');
      }
    });
  }

  applySearchFilter(): void {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      this.filteredPartners = [...this.assignedPartners];
      return;
    }

    const query = this.searchQuery.trim();
    const queryLower = query.toLowerCase();

    // Verificar si la búsqueda es solo números (búsqueda por partnerNumber)
    const isNumericSearch = /^\d+$/.test(query);

    this.filteredPartners = this.assignedPartners.filter(partner => {
      if (isNumericSearch) {
        // Si la búsqueda es numérica, buscar coincidencia exacta del número de socio
        if (partner.partnerNumber) {
          return partner.partnerNumber.toString() === query;
        }
        return false;
      } else {
        // Si la búsqueda es texto, buscar por nombre o identificación
        const name = partner.partnerName?.toLowerCase() || '';
        const identification = partner.partnerIdentificationNumber?.toLowerCase() || '';
        return name.includes(queryLower) || identification.includes(queryLower);
      }
    });
  }

  onSearchChange(): void {
    this.applySearchFilter();
  }

  initializeAttendanceMap(): void {
    this.partnerAttendanceMap.clear();

    this.assignedPartners.forEach(partner => {
      // Buscar si ya existe un registro de asistencia para este socio y fecha
      // Usar comparación insensible a mayúsculas/minúsculas para UUIDs
      const existingRecord = this.attendanceRecords.find(
        a => a.partnerId.toLowerCase() === partner.partnerId.toLowerCase()
      );

      this.partnerAttendanceMap.set(partner.partnerId, {
        present: existingRecord?.present ?? false,
        checkInTime: existingRecord?.checkInTime ? this.formatTime(existingRecord.checkInTime) : '',
        checkOutTime: existingRecord?.checkOutTime ? this.formatTime(existingRecord.checkOutTime) : ''
      });
    });
  }

  formatSelectedDate(): void {
    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(this.selectedDate.getDate()).padStart(2, '0');
    this.selectedDateStr = `${year}-${month}-${day}`;
  }

  onDateChange(event: any): void {
    if (event && event.selectedDates && event.selectedDates.length > 0) {
      this.selectedDate = event.selectedDates[0];
      this.formatSelectedDate();
      this.loadAttendanceForDate();
    }
  }

  loadAttendanceForDate(): void {
    if (!this.selectedDateStr) return;

    this.attendanceService.getAttendanceByJobAndDate(this.jobId, this.selectedDateStr).subscribe({
      next: (records) => {
        this.attendanceRecords = records;
        this.initializeAttendanceMap();
      },
      error: (error) => {
        console.error('Error al cargar asistencia:', error);
        // No mostrar error si simplemente no hay registros
        this.attendanceRecords = [];
        this.initializeAttendanceMap();
      }
    });
  }

  isPresent(partnerId: string): boolean {
    return this.partnerAttendanceMap.get(partnerId)?.present ?? false;
  }

  getAttendance(partnerId: string) {
    return this.partnerAttendanceMap.get(partnerId) || {
      present: false,
      checkInTime: '',
      checkOutTime: ''
    };
  }

  convertToISO(timeStr: string): string {
    // Convertir formato HH:mm a ISO datetime
    if (!timeStr || !timeStr.includes(':')) return '';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date(this.selectedDate);
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date.toISOString();
  }

  formatTime(isoString: string): string {
    if (!isoString) return '';
    // If it contains T, split and take the time part
    if (isoString.includes('T')) {
      const timePart = isoString.split('T')[1];
      // Keep only HH:mm
      return timePart.substring(0, 5);
    }
    return '';
  }

  handleError(error: any): void {
    let userMessage = '';
    if (error.status === 0) {
      userMessage = 'No se puede conectar al servidor.';
    } else if (error.status === 401) {
      userMessage = 'No tienes autorización. Por favor inicia sesión.';
    } else if (error.status === 400) {
      userMessage = `Datos inválidos: ${error.error?.message || 'Verifica los datos ingresados'}`;
    } else {
      userMessage = `Error: ${error.error?.message || error.statusText || 'Error desconocido'}`;
    }
    toast.error(userMessage);
  }



  goBack(): void {
    this.router.navigate(['/jobs']);
  }

  get presentCount(): number {
    return Array.from(this.partnerAttendanceMap.values()).filter(a => a.present).length;
  }

  get absentCount(): number {
    return Array.from(this.partnerAttendanceMap.values()).filter(a => !a.present).length;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  }

  formatDateForDisplay(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${day} de ${month} de ${year}`;
  }
}

