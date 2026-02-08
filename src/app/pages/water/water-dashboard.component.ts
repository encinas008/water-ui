import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { ReportService } from '../../shared/services/report.service';
import { PartnerService } from '../../shared/services/partner.service';
import { DashboardStatsDto, PartnerOutputDto, PartnerConsumptionStatsDto } from '../../shared/models/water-system.models';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  ApexFill,
  ApexTooltip,
  ApexPlotOptions,
  NgApexchartsModule
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  fill: ApexFill;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  colors: string[];
};

@Component({
  selector: 'app-water-dashboard',
  standalone: true,
  imports: [CommonModule, PageBreadcrumbComponent, ButtonComponent, NgApexchartsModule, FormsModule, ReactiveFormsModule],
  templateUrl: './water-dashboard.component.html',
})
export class WaterDashboardComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;
  @ViewChild('partnerChart') partnerChart!: ChartComponent;

  public chartOptions: Partial<ChartOptions> | any;
  public partnerChartOptions: Partial<ChartOptions> | any;

  breadcrumbItems = [
    { label: 'Dashboard de Agua', link: '/water-dashboard' }
  ];

  stats?: DashboardStatsDto;
  isLoading = true;
  selectedYear: number = 0; // 0 means "Last 12 months"
  availableYears: number[] = [];

  // Partner Search & Stats
  partnerSearchTerm: string = '';
  selectedPartner?: PartnerOutputDto;
  partnerStats?: PartnerConsumptionStatsDto;
  isSearchingPartner = false;
  selectedPartnerYear: number = 0; // 0 means "Last 12 months"

  constructor(
    private reportService: ReportService,
    private partnerService: PartnerService,
    private router: Router
  ) {
    // Initialize available years (last 5 years)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      this.availableYears.push(currentYear - i);
    }
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    const yearParam = this.selectedYear > 0 ? this.selectedYear : undefined;
    this.reportService.getDashboardStats(yearParam).subscribe({
      next: (data) => {
        this.stats = data;
        this.initChart();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas del dashboard:', error);
        this.isLoading = false;
      }
    });
  }

  onYearChange(event: any): void {
    this.selectedYear = +event.target.value;
    this.loadDashboardData();
  }

  onPartnerYearChange(event: any): void {
    this.selectedPartnerYear = +event.target.value;
    if (this.selectedPartner) {
      this.loadPartnerStats();
    }
  }

  onSearchPartner(): void {
    if (!this.partnerSearchTerm) return;

    this.isSearchingPartner = true;
    this.partnerService.searchPartners(this.partnerSearchTerm).subscribe({
      next: (partners) => {
        this.isSearchingPartner = false;
        if (partners.length > 0) {
          // Find exact match if possible
          const match = partners.find(p => p.partnerNumber?.toString() === this.partnerSearchTerm) || partners[0];
          this.selectPartner(match);
        } else {
          this.selectedPartner = undefined;
          this.partnerStats = undefined;
          // Could add toast here
        }
      },
      error: () => {
        this.isSearchingPartner = false;
        this.selectedPartner = undefined;
      }
    });
  }

  selectPartner(partner: PartnerOutputDto) {
    this.selectedPartner = partner;
    this.loadPartnerStats();
  }

  loadPartnerStats() {
    if (!this.selectedPartner) return;

    const yearParam = this.selectedPartnerYear > 0 ? this.selectedPartnerYear : undefined;
    this.reportService.getPartnerConsumptionStats(this.selectedPartner.id, yearParam)
      .subscribe(stats => {
        this.partnerStats = stats;
        this.initPartnerChart();
      });
  }

  initChart(): void {
    if (!this.stats) return;

    const categories = this.stats.monthlyConsumption.map(d => d.month);
    const seriesData = this.stats.monthlyConsumption.map(d => d.consumption);

    this.chartOptions = {
      series: [
        {
          name: "Consumo (m³)",
          data: seriesData
        }
      ],
      chart: {
        height: 350,
        type: "bar",
        toolbar: {
          show: false
        },
        fontFamily: 'Inter, sans-serif'
      },
      colors: ['#3C50E0'],
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: '40%',
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"]
      },
      xaxis: {
        categories: categories,
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val + " m³";
          }
        }
      },
      grid: {
        borderColor: '#f1f1f1',
      }
    };
  }

  initPartnerChart(): void {
    if (!this.partnerStats) return;

    const categories = this.partnerStats.monthlyConsumption.map(d => d.month);
    const seriesData = this.partnerStats.monthlyConsumption.map(d => d.consumption);

    this.partnerChartOptions = {
      series: [
        {
          name: "Consumo Socio (m³)",
          data: seriesData
        }
      ],
      chart: {
        height: 350,
        type: "bar",
        toolbar: {
          show: false
        },
        fontFamily: 'Inter, sans-serif'
      },
      colors: ['#10B981'], // Emerald constant
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: '40%',
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"]
      },
      xaxis: {
        categories: categories,
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val + " m³";
          }
        }
      },
      grid: {
        borderColor: '#f1f1f1',
      }
    };
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
