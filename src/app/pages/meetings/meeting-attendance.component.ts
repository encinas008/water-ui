import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { MeetingService } from '../../shared/services/meeting.service';
import { MeetingAttendanceService } from '../../shared/services/meeting-attendance.service';
import { MeetingOutputDto, PartnerAssignmentInfoDto, MeetingAttendanceOutputDto, BulkMeetingAttendanceInputDto, PartnerAttendanceDto } from '../../shared/models/water-system.models';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-meeting-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    ButtonComponent,
    BadgeComponent,
    DatePickerComponent,
    InputFieldComponent
  ],
  providers: [DatePipe],
  templateUrl: './meeting-attendance.component.html',
  styles: ``
})
export class MeetingAttendanceComponent implements OnInit {
  meetingId: string = '';
  meeting: MeetingOutputDto | null = null;
  assignedPartners: PartnerAssignmentInfoDto[] = [];
  filteredPartners: PartnerAssignmentInfoDto[] = [];
  attendanceRecords: MeetingAttendanceOutputDto[] = [];

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private meetingService: MeetingService,
    private meetingAttendanceService: MeetingAttendanceService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.meetingId = params['id'];
      if (this.meetingId) {
        this.loadMeeting();
        this.loadAssignedPartners();
        this.formatSelectedDate();
        this.loadAttendanceForDate();
      }
    });
  }

  loadMeeting(): void {
    this.meetingService.getMeetingById(this.meetingId).subscribe({
      next: (meeting) => {
        this.meeting = meeting;
      },
      error: (error) => {
        console.error('Error al cargar reunión:', error);
        toast.error('Error al cargar la reunión');
      }
    });
  }

  loadAssignedPartners(): void {
    this.isLoading = true;
    this.meetingAttendanceService.getMeetingWithPartnerAssignments(this.meetingId).subscribe({
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
      const existingRecord = this.attendanceRecords.find(
        a => a.partnerId === partner.partnerId
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

    this.meetingAttendanceService.getAttendanceByMeetingAndDate(this.meetingId, this.selectedDateStr).subscribe({
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

  toggleAttendance(partnerId: string): void {
    const attendance = this.partnerAttendanceMap.get(partnerId);
    if (attendance) {
      attendance.present = !attendance.present;
      // Si se marca como ausente, limpiar horas de entrada y salida
      if (!attendance.present) {
        attendance.checkInTime = '';
        attendance.checkOutTime = '';
      }
      // Guardar inmediatamente en el API
      this.saveAttendanceForPartner(partnerId, attendance);
    }
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

  markCheckIn(partnerId: string): void {
    const attendance = this.partnerAttendanceMap.get(partnerId);
    if (attendance && attendance.present) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      attendance.checkInTime = `${hours}:${minutes}`;
      // Guardar inmediatamente en el API
      this.saveAttendanceForPartner(partnerId, attendance);
    }
  }

  markCheckOut(partnerId: string): void {
    const attendance = this.partnerAttendanceMap.get(partnerId);
    if (attendance && attendance.present) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      attendance.checkOutTime = `${hours}:${minutes}`;
      // Guardar inmediatamente en el API
      this.saveAttendanceForPartner(partnerId, attendance);
    }
  }

  canMarkCheckIn(partnerId: string): boolean {
    const attendance = this.partnerAttendanceMap.get(partnerId);
    return attendance?.present === true && !attendance.checkInTime;
  }

  canMarkCheckOut(partnerId: string): boolean {
    const attendance = this.partnerAttendanceMap.get(partnerId);
    return attendance?.present === true && !!attendance.checkInTime && !attendance.checkOutTime;
  }

  saveAttendanceForPartner(partnerId: string, attendance: { present: boolean; checkInTime: string; checkOutTime: string }): void {
    if (!this.selectedDateStr) {
      return;
    }

    // Buscar si ya existe un registro de asistencia para este socio y fecha
    const existingRecord = this.attendanceRecords.find(
      a => a.partnerId === partnerId
    );

    const partnerAttendance: PartnerAttendanceDto = {
      partnerId,
      present: attendance.present,
      checkInTime: attendance.checkInTime ? this.convertToISO(attendance.checkInTime) : undefined,
      checkOutTime: attendance.checkOutTime ? this.convertToISO(attendance.checkOutTime) : undefined
    };

    const bulkAttendance: BulkMeetingAttendanceInputDto = {
      meetingId: this.meetingId,
      attendanceDate: this.selectedDateStr,
      attendances: [partnerAttendance]
    };

    this.meetingAttendanceService.bulkCreateAttendance(bulkAttendance).subscribe({
      next: (savedAttendances) => {
        // Actualizar el registro local si se guardó exitosamente
        if (savedAttendances.length > 0) {
          const saved = savedAttendances[0];
          if (!existingRecord) {
            this.attendanceRecords.push(saved);
          } else {
            const index = this.attendanceRecords.findIndex(a => a.id === existingRecord.id);
            if (index !== -1) {
              this.attendanceRecords[index] = saved;
            }
          }
        }
      },
      error: (error) => {
        console.error(`Error al guardar asistencia para socio ${partnerId}:`, error);
        // Revertir el cambio local si falla el guardado
        this.loadAttendanceForDate();
      }
    });
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
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }



  goBack(): void {
    this.router.navigate(['/meetings']);
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

  formatTimeForMeeting(hour: number, minute: number, amPm: string): string {
    const minuteStr = String(minute).padStart(2, '0');
    return `${hour}:${minuteStr} ${amPm}`;
  }
}

