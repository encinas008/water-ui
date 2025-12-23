import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { MeetingPartnerService } from '../../shared/services/meeting-partner.service';
import { PartnerAssignmentInfoDto } from '../../shared/models/water-system.models';

@Component({
  selector: 'app-assign-partners-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent
  ],
  templateUrl: './assign-partners-modal.component.html',
  styles: ``
})
export class AssignPartnersModalComponent implements OnInit, OnChanges {
  @Input() meetingId: string = '';
  @Input() meetingName: string = '';
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() assigned = new EventEmitter<void>();

  partners: PartnerAssignmentInfoDto[] = [];
  selectedPartnerIds: Set<string> = new Set();
  
  // Filtro por rango de partnerNumber
  minPartnerNumber: number | null = null;
  maxPartnerNumber: number | null = null;
  
  isLoading: boolean = false;
  isSaving: boolean = false;
  errorMessage: string = '';

  constructor(private meetingPartnerService: MeetingPartnerService) {}

  ngOnInit(): void {
    if (this.isOpen && this.meetingId) {
      this.loadPartners();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.meetingId) {
      this.loadPartners();
    }
  }

  loadPartners(): void {
    if (!this.meetingId) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.meetingPartnerService.getMeetingWithPartnerAssignments(this.meetingId).subscribe({
      next: (data) => {
        this.partners = data.assignedPartners;
        // Marcar los socios que ya están asignados
        this.selectedPartnerIds.clear();
        data.assignedPartners.forEach(partner => {
          if (partner.isAssigned) {
            this.selectedPartnerIds.add(partner.partnerId);
          }
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al cargar socios:', error);
        
        if (error.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté corriendo.';
        } else if (error.status === 401) {
          this.errorMessage = 'No tienes autorización. Por favor inicia sesión.';
        } else if (error.status === 404) {
          this.errorMessage = 'La reunión no fue encontrada.';
        } else {
          this.errorMessage = `Error al cargar los socios: ${error.error?.message || error.statusText || 'Error desconocido'}`;
        }
      }
    });
  }

  togglePartner(partnerId: string): void {
    if (this.selectedPartnerIds.has(partnerId)) {
      this.selectedPartnerIds.delete(partnerId);
    } else {
      this.selectedPartnerIds.add(partnerId);
    }
  }

  isPartnerSelected(partnerId: string): boolean {
    return this.selectedPartnerIds.has(partnerId);
  }

  onSave(): void {
    if (!this.meetingId) return;

    this.isSaving = true;
    this.errorMessage = '';

    const partnerIds = Array.from(this.selectedPartnerIds);

    this.meetingPartnerService.assignPartnersToMeeting(this.meetingId, partnerIds).subscribe({
      next: () => {
        this.isSaving = false;
        this.assigned.emit();
        this.closeModal();
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error al asignar socios:', error);
        
        if (error.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté corriendo.';
        } else if (error.status === 401) {
          this.errorMessage = 'No tienes autorización. Por favor inicia sesión.';
        } else if (error.status === 400) {
          this.errorMessage = `Datos inválidos: ${error.error?.message || 'Verifica los datos ingresados'}`;
        } else {
          this.errorMessage = `Error al asignar socios: ${error.error?.message || error.statusText || 'Error desconocido'}`;
        }
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }

  get selectedCount(): number {
    return this.selectedPartnerIds.size;
  }

  get filteredPartners(): PartnerAssignmentInfoDto[] {
    let filtered = this.partners;

    if (this.minPartnerNumber !== null || this.maxPartnerNumber !== null) {
      filtered = filtered.filter(partner => {
        if (!partner.partnerNumber) {
          return false; // Excluir socios sin número
        }

        const partnerNum = partner.partnerNumber;

        if (this.minPartnerNumber !== null && partnerNum < this.minPartnerNumber) {
          return false;
        }

        if (this.maxPartnerNumber !== null && partnerNum > this.maxPartnerNumber) {
          return false;
        }

        return true;
      });
    }
    return filtered;
  }

  get minAvailableNumber(): number | null {
    const numbers = this.partners
      .map(p => p.partnerNumber)
      .filter((n): n is number => n !== undefined && n !== null);
    return numbers.length > 0 ? Math.min(...numbers) : null;
  }

  get maxAvailableNumber(): number | null {
    const numbers = this.partners
      .map(p => p.partnerNumber)
      .filter((n): n is number => n !== undefined && n !== null);
    return numbers.length > 0 ? Math.max(...numbers) : null;
  }

  clearRangeFilter(): void {
    this.minPartnerNumber = null;
    this.maxPartnerNumber = null;
  }

  hasActiveRangeFilter(): boolean {
    return this.minPartnerNumber !== null || this.maxPartnerNumber !== null;
  }

  get allFilteredPartnersSelected(): boolean {
    if (this.filteredPartners.length === 0) {
      return false;
    }
    return this.filteredPartners.every(partner => this.selectedPartnerIds.has(partner.partnerId));
  }

  get someFilteredPartnersSelected(): boolean {
    if (this.filteredPartners.length === 0) {
      return false;
    }
    const selectedCount = this.filteredPartners.filter(partner => 
      this.selectedPartnerIds.has(partner.partnerId)
    ).length;
    return selectedCount > 0 && selectedCount < this.filteredPartners.length;
  }

  toggleSelectAll(): void {
    if (this.allFilteredPartnersSelected) {
      // Deseleccionar todos los socios filtrados
      this.filteredPartners.forEach(partner => {
        this.selectedPartnerIds.delete(partner.partnerId);
      });
    } else {
      // Seleccionar todos los socios filtrados
      this.filteredPartners.forEach(partner => {
        this.selectedPartnerIds.add(partner.partnerId);
      });
    }
  }
}

