import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingConfigService } from '../../shared/services/billing-config.service';
import { BillingConfigOutputDto } from '../../shared/models/water-system.models';
import { toast } from 'ngx-sonner';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

@Component({
    selector: 'app-billing-config',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonComponent],
    templateUrl: './billing-config.component.html'
})
export class BillingConfigComponent implements OnInit {
    configs: BillingConfigOutputDto[] = [];
    isLoading = false;
    isSaving = false;

    // Form values
    aporteDeporte = 0;
    aporteOTB = 0;
    tarifaBasica = 0;
    multaExcesoM3 = 0;

    constructor(private billingConfigService: BillingConfigService) { }

    ngOnInit(): void {
        this.loadConfigs();
    }

    loadConfigs(): void {
        this.isLoading = true;
        this.billingConfigService.getAllConfigs().subscribe({
            next: (configs) => {
                this.configs = configs;
                this.populateFormValues();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading configs:', error);
                toast.error('Error al cargar configuraciones');
                this.isLoading = false;
            }
        });
    }

    populateFormValues(): void {
        this.configs.forEach(config => {
            switch (config.configKey) {
                case 'APORTE_DEPORTE':
                    this.aporteDeporte = config.configValue;
                    break;
                case 'APORTE_OTB':
                    this.aporteOTB = config.configValue;
                    break;
                case 'TARIFA_BASICA':
                    this.tarifaBasica = config.configValue;
                    break;
                case 'MULTA_EXCESO_M3':
                    this.multaExcesoM3 = config.configValue;
                    break;
            }
        });
    }

    saveConfigs(): void {
        if (!this.validateInputs()) {
            toast.error('Todos los valores deben ser mayores a cero');
            return;
        }

        this.isSaving = true;
        const updates = [
            this.billingConfigService.updateConfig('APORTE_DEPORTE', this.aporteDeporte),
            this.billingConfigService.updateConfig('APORTE_OTB', this.aporteOTB),
            this.billingConfigService.updateConfig('TARIFA_BASICA', this.tarifaBasica),
            this.billingConfigService.updateConfig('MULTA_EXCESO_M3', this.multaExcesoM3)
        ];

        // Execute all updates
        Promise.all(updates.map(obs => obs.toPromise()))
            .then(() => {
                toast.success('Configuración actualizada correctamente');
                this.loadConfigs(); // Reload to confirm
                this.isSaving = false;
            })
            .catch((error) => {
                console.error('Error saving configs:', error);
                toast.error('Error al guardar configuración');
                this.isSaving = false;
            });
    }

    resetForm(): void {
        this.populateFormValues();
        toast.info('Valores restaurados');
    }

    validateInputs(): boolean {
        return this.aporteDeporte > 0 &&
            this.aporteOTB > 0 &&
            this.tarifaBasica > 0 &&
            this.multaExcesoM3 > 0;
    }
}
