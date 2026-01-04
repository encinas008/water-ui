// ============================================
// ENUMS Y TIPOS
// ============================================

export enum ConnectionStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CUT_OFF = 'CUT_OFF',
  INACTIVE = 'INACTIVE'
}

// ============================================
// BILLING CONFIGURATION
// ============================================

export interface BillingConfigOutputDto {
  id: string;
  configKey: string;
  configValue: number;
  description?: string;
}

export interface BillingConfigUpdateDto {
  configValue: number;
}

export enum BillStatus {
  PENDING = 'PENDING',
  PARTIAL_PAID = 'PARTIAL_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

// ============================================
// PARTNER (SOCIO) - Entidades principales
// ============================================

export interface PartnerOutputDto {
  id: string;
  partnerNumber?: number; // Número incremental único autogenerado
  fullName: string;
  partnerIdentificationNumber: string;
  phoneNumber?: string;
  email?: string;
  address?: string;

  // Campos de conexión de agua
  waterConnectionNumber?: string;
  waterMeterNumber?: string;
  connectionStatusCode?: ConnectionStatus;
  connectionStatusName?: string;
  connectionDate?: string;
  waterConnectionAddress?: string;
  currentDebt?: number;
  lastBillingDate?: string;
  isElderly?: boolean;
  notes?: string;

  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastPaymentId?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface PartnerInputDto {
  fullName: string;
  partnerIdentificationNumber?: string;
  phoneNumber?: string;
  address?: string;

  // Campos de conexión de agua
  waterMeterNumber?: string;
  connectionStatusCode?: string;
  connectionDate?: string;
  waterConnectionAddress?: string;
  isElderly?: boolean;
  notes?: string;

  // Cobro de instalación
  installationAmount?: number;
  paymentTypeId?: string;
  cashBalanceId?: string;
  userId?: string;
}

export interface PartnerDebtSummaryDto {
  partnerId: string;
  partnerName: string;
  partnerIdentificationNumber: string;
  waterConnectionNumber?: string;
  connectionStatus: string;
  totalDebt: number;
  pendingBillsCount: number;
  overdueBillsCount: number;
  oldestUnpaidBillDate?: string;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
}

// ============================================
// LECTURAS DE MEDIDOR
// ============================================

export interface WaterMeterReadingOutputDto {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerNumber?: number;
  waterMeterNumber?: string;

  readingDate: string;
  previousReading?: number;
  currentReading: number;
  consumption: number;  // Backend usa 'consumption' no 'consumptionM3'

  observation?: string;  // Backend usa 'observation' no 'notes'
  imageUrl?: string;

  createdAt: string;
  updatedAt: string;
}

export interface WaterMeterReadingInputDto {
  partnerId: string;
  userId: string;  // UUID del usuario que registra la lectura
  readingDate: string;  // LocalDate en backend (YYYY-MM-DD)
  currentReading: number;  // BigDecimal en backend
  observation?: string;  // Backend usa 'observation'
  imageId?: string;  // UUID opcional
}

// ============================================
// FACTURAS DE AGUA
// ============================================

export interface BillConceptItemDto {
  id: string;
  conceptName: string;
  assignedDate: string;
  amount: number;
}

export interface WaterBillOutputDto {
  id: string;
  billNumber: string;
  partnerId: string;
  partnerName: string;
  partnerNumber?: number;
  waterConnectionNumber?: string;

  billingPeriodStart: string;
  billingPeriodEnd: string;

  readingId?: string;
  previousReading?: number;
  currentReading?: number;
  consumptionM3: number;

  ratePerM3: number;
  baseAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;

  statusCode: string;
  statusName: string;

  dueDate: string;
  paidDate?: string;
  isOverdue: boolean;

  concepts?: BillConceptItemDto[];  // Conceptos de cobro desglosados
  pendingFines?: PendingFineDto[]; // Multas pendientes (trabajos/reuniones)
  totalFinesAmount?: number; // Suma de multas pendientes
  totalPayableAmount?: number; // totalAmount + totalFinesAmount
  totalFinesPaid?: number;  // Total de multas pagadas en esta factura

  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface WaterBillSummaryDto {
  id: string;
  billNumber: string;
  partnerName: string;
  billingPeriod: string;
  consumptionM3: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  billStatus: string;
  dueDate: string;
  isOverdue: boolean;
}

export interface WaterBillStatsDto {
  totalBills: number;
  pendingBillsCount: number;
  overdueBillsCount: number;
  paidBillsCount: number;
  totalPendingAmount: number;
  totalOverdueAmount: number;
  totalPaidAmount: number;
}

export interface GenerateMonthlyBillsRequestDto {
  billingPeriodStart: string;
  billingPeriodEnd: string;
  ratePerM3: number;
  dueDate: string;
  additionalCharges?: number;
  notes?: string;
}

export interface GenerateMonthlyBillsResponseDto {
  billsGenerated: number;
  totalAmount: number;
  errors: string[];
  generatedBills: WaterBillSummaryDto[];
}

// ============================================
// PAGOS DE AGUA
// ============================================

export interface PaymentFineDetailDto {
  id: string;
  type: string; // "JOB" o "MEETING"
  name: string;
  date: string; // YYYY-MM-DD
  fineAmount: number;
}

export interface PaymentDetailDto {
  billAmount: number;
  finesAmount: number;
  totalAmount: number;
  jobFines: PaymentFineDetailDto[];
  meetingFines: PaymentFineDetailDto[];
}

export interface WaterPaymentOutputDto {
  id: string;
  receiptNumber: string;
  waterBillId: string;
  billNumber: string;
  partnerId: string;
  partnerName: string;

  paymentDate: string;
  amount: number;

  paymentTypeId?: string;
  paymentTypeName: string;

  reference?: string;
  notes?: string;
  observation?: string;

  processedBy?: string;
  cashierName?: string;
  paymentDetail?: PaymentDetailDto; // Detalle del pago incluyendo multas

  createdAt: string;
  updatedAt?: string;
}

export interface WaterBillDetailDto {
  bill: WaterBillOutputDto;
  payments: WaterPaymentOutputDto[];
}

export interface WaterPaymentInputDto {
  waterBillId?: string;
  partnerId: string;
  paymentDate: string;
  amount: number;
  paymentTypeId: string;
  userId?: string;         // UUID del usuario autenticado que registra el pago
  cashBalanceId?: string;  // UUID opcional del balance de caja
  observation?: string;    // Observaciones del pago (default: "")
  includePendingFines?: boolean; // Si incluir multas pendientes del mes
}

// Pending Fines DTOs
export interface PendingFineDto {
  id: string;
  type: string; // "JOB" o "MEETING"
  name: string;
  date: string; // LocalDate
  fine: number;
}

export interface MonthlyPendingFinesDto {
  partnerId: string;
  month: number;
  year: number;
  jobAbsences: PendingFineDto[];
  meetingAbsences: PendingFineDto[];
  totalFines: number;
}

export interface PaymentReceiptDto {
  receiptNumber: string;
  paymentDate: string;
  partnerName: string;
  partnerIdentificationNumber: string;
  waterConnectionNumber?: string;
  billNumber: string;
  billingPeriod: string;
  amountPaid: number;
  paymentMethod: string;
  reference?: string;
  processedBy?: string;
  balanceAfterPayment: number;
}

export interface PaymentReceiptFullDto {
  receiptNumber: string;
  receiptType: string;  // "NOTA DE PAGO" o "COPIA ARCHIVO"
  partnerNumber: string;  // Número del socio (ej: "31")
  partnerName: string;
  partnerIdentificationNumber: string;  // RECLAMOS
  paymentDate: string;  // Fecha y hora de pago formateada
  currentReading: number;  // LECTURA ACT.
  previousReading: number;  // LECTURA ANT.
  consumptionM3: number;  // CONSUMO M3
  meterNumber?: string;  // NRO. MEDIDOR
  paymentMonth: string;  // MES DE PAGO (ej: "JUNIO")
  paymentMonthCode?: string;  // CÓDIGO
  paymentMonthDate: string;  // Date formateada (ej: "31-junio-2025")
  concepts: BillConceptItemDto[];  // Conceptos desglosados
  totalAmount: number;  // IMPORTE TOTAL
  totalAmountInWords: string;  // Total en palabras (ej: "Son Veinte Bolivianos.")
  communityName?: string;  // Nombre de la comunidad
}

// ============================================
// REPORTES
// ============================================

export interface DebtReportDto {
  partnerId: string;
  partnerName: string;
  partnerIdentificationNumber: string;
  waterConnectionNumber?: string;
  connectionStatus: string;
  totalDebt: number;
  pendingBills: number;
  overdueBills: number;
  oldestUnpaidDate?: string;
}

export interface ConsumptionReportDto {
  partnerId: string;
  partnerName: string;
  waterConnectionNumber?: string;
  period: string;
  consumptionM3: number;
  totalAmount: number;
  averageConsumption?: number;
}

export interface CollectionReportDto {
  period: string;
  billsGenerated: number;
  totalBilled: number;
  paymentsReceived: number;
  totalCollected: number;
  collectionRate: number;
  pendingAmount: number;
}

export interface ActivePartnersReportDto {
  partnerId: string;
  partnerName: string;
  partnerIdentificationNumber: string;
  waterConnectionNumber?: string;
  waterMeterNumber?: string;
  connectionStatus: string;
  connectionDate?: string;
  currentDebt: number;
  lastBillingDate?: string;
}

export interface PendingReadingsReportDto {
  partnerId: string;
  partnerName: string;
  waterConnectionNumber?: string;
  waterMeterNumber?: string;
  lastReadingDate?: string;
  daysSinceLastReading?: number;
}

// ============================================
// TIPOS DE CATÁLOGO
// ============================================

export interface ConnectionStatusType {
  code: string;
  name: string;
  description?: string;
}

export interface BillStatusType {
  code: string;
  name: string;
  description?: string;
}

export interface PaymentType {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

// ============================================
// RESPUESTAS GENÉRICAS
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  first: boolean;
  last: boolean;
}

// ============================================
// CASH BALANCE (BALANCE DE CAJA)
// ============================================

export interface CashBalanceInputDto {
  moneyToOpenCashBalance: number;  // BigDecimal en backend
  userId: string;                    // UUID en backend
}

export interface CloseCashBalanceInputDto {
  cashBalanceId: string;  // UUID en backend
}

export interface CashBalanceOutputDto {
  id: string;
  description: string;
  assignee: string;  // Nombre del usuario asignado
  openTime: string;   // OffsetDateTime en backend
  closeTime?: string; // OffsetDateTime? en backend
  initialMoney: number; // BigDecimal en backend
  active: boolean;
  createdAt: string;   // OffsetDateTime en backend
  updatedAt?: string;   // OffsetDateTime? en backend
}

export interface CashFromSaleDetails {
  cash: number;           // BigDecimal en backend
  qr: number;             // BigDecimal en backend
  transference: number;    // BigDecimal en backend
}

export interface CashFromCashFlowsDetails {
  cashIn: number;         // BigDecimal en backend
  cashQrIn: number;       // BigDecimal en backend
  cashTransferIn: number; // BigDecimal en backend
  cashOut: number;        // BigDecimal en backend
  cashQrOut: number;       // BigDecimal en backend
  cashTransferOut: number; // BigDecimal en backend
}

export interface CashBalanceDetails {
  totalCashFromSales: number;      // BigDecimal en backend
  cashFromSalesInCash: number;     // BigDecimal en backend
  cashFromSalesInOthers: number;   // BigDecimal en backend
  totalCash: number;               // BigDecimal en backend
  totalOthers: number;              // BigDecimal en backend
  totalCashInBox: number;          // BigDecimal en backend
}

export interface CashFlowType {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface CashFlowInputDto {
  paymentTypeId: string;      // UUID en backend
  cashFlowTypeId: string;     // UUID en backend (EGRESO para retiros)
  amount: number;             // BigDecimal en backend
  description: string;
  userId: string;             // UUID en backend
  cashBalanceId?: string;     // UUID opcional
}

export interface CashFlowOutputDto {
  id: string;
  box: string;
  boxId: string;
  assignee: string;
  type: string;               // "EGRESO" o "INGRESO"
  description: string;
  amount: number;             // BigDecimal en backend
  active: boolean;
  createdAt: string;          // OffsetDateTime en backend
  updatedAt?: string;         // OffsetDateTime? en backend
}

export interface CashBalanceDetailsOutputDto {
  id: string;
  description: string;
  assignee: string;
  boxName: string;
  openTime: string;                // OffsetDateTime en backend
  closeTime?: string;              // OffsetDateTime? en backend
  initialMoney: number;             // BigDecimal en backend
  cashFromSalesDetails: CashFromSaleDetails;
  cashFromCashFlowsDetails: CashFromCashFlowsDetails;
  cashBalanceDetails: CashBalanceDetails;
  active: boolean;
  createdAt: string;                // OffsetDateTime en backend
  updatedAt?: string;               // OffsetDateTime? en backend
}

// ============================================
// JOB (TRABAJO) - Administración de trabajos
// ============================================

export interface JobOutputDto {
  id: string;
  name: string;
  startDate: string;  // LocalDate en backend (YYYY-MM-DD)
  description: string;
  fine: number;
  active: boolean;
  createdAt: string;  // OffsetDateTime en backend
  updatedAt?: string;  // OffsetDateTime? en backend
}

export interface JobInputDto {
  name: string;
  startDate: string;  // LocalDate en backend (YYYY-MM-DD)
  description?: string;
  fine: number;
}

export interface JobUpdateDto {
  name?: string;
  startDate?: string;  // LocalDate en backend (YYYY-MM-DD)
  description?: string;
  fine: number;
}

// ============================================
// JOB-PARTNER (ASIGNACIÓN DE SOCIOS A TRABAJOS)
// ============================================

export interface JobPartnerOutputDto {
  id: string;
  jobId: string;
  jobName: string;
  partnerId: string;
  partnerName: string;
  partnerIdentificationNumber: string;
  active: boolean;
  createdAt: string;
}

// ============================================
// ROLES
// ============================================
export interface RoleOutputDto {
  id: string;
  name: string;
  description?: string;
  code: string;
}

export interface UserOutputDto {
  username: string;
  profileId: string;
  roleId: string;
}

// Ensure Profile interface matches backend
export interface ProfileDto {
  dni: string;
  name: string;
  lastname: string;
  email?: string;
  cellphone?: string;
  telephone?: string;
  cellphoneReferences?: string;
  address?: string;
  birthDate?: string;
  country: string;
  city: string;
  gender: string;
  civilStatus: string;
  photoUrl?: string;
  occupation?: string;
}

export interface UserDetailsOutputDto {
  id: string;
  username: string;
  profile: ProfileDto;
  role?: RoleOutputDto;
  active: boolean;
}

export type UserDetails = UserDetailsOutputDto; // Alias for convenience

export interface UniqueFieldsDto {
  isUsernameUpdated?: boolean;
  isDniUpdated?: boolean;
}

export interface ProfileInputDto {
  dni: string;
  name: string;
  lastname: string;
  email?: string;
  cellphone?: string;
  telephone?: string;
  cellphoneReferences?: string;
  address?: string;
  birthDate?: string;
  countryId: string;
  cityId: string;
  genderTypeId: string;
  civilStatusTypeId: string;
  imageId?: string;
}

export interface UserInputDto {
  username: string;
  password?: string;
  profile: ProfileInputDto;
  role?: string; // Role Name
  checkUniqueFields: UniqueFieldsDto;
}

export interface UpdateUserInputDto {
  username: string;
  password?: string;
  profile: ProfileInputDto;
  role?: string; // Role Name
  checkUniqueFields: UniqueFieldsDto;
}

export interface AssignPartnersToJobDto {
  partnerIds: string[];
}

export interface JobPartnerAssignmentDto {
  jobId: string;
  jobName: string;
  assignedPartners: PartnerAssignmentInfoDto[];
}

export interface PartnerAssignmentInfoDto {
  partnerId: string;
  partnerNumber?: number; // Número incremental único del socio
  partnerName: string;
  partnerIdentificationNumber: string;
  isAssigned: boolean;
  assignmentId?: string;
}

// ============================================
// ATTENDANCE (ASISTENCIA DE SOCIOS A TRABAJOS)
// ============================================

export interface AttendanceOutputDto {
  id: string;
  jobId: string;
  jobName: string;
  partnerId: string;
  partnerName: string;
  partnerNumber?: number;
  partnerIdentificationNumber: string;
  attendanceDate: string; // YYYY-MM-DD
  present: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceInputDto {
  jobId: string;
  partnerId: string;
  attendanceDate: string; // YYYY-MM-DD
  present: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface AttendanceUpdateDto {
  present?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface AttendanceByDateDto {
  attendanceDate: string; // YYYY-MM-DD
  attendances: AttendanceOutputDto[];
}

export interface BulkAttendanceInputDto {
  jobId: string;
  attendanceDate: string; // YYYY-MM-DD
  attendances: PartnerAttendanceDto[];
}

export interface PartnerAttendanceDto {
  partnerId: string;
  present: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}

// ============================================
// MEETING (REUNIÓN) - Administración de reuniones
// ============================================

export interface MeetingOutputDto {
  id: string;
  name: string;
  meetingDate: string; // YYYY-MM-DD
  hour: number; // 1-12
  minute: number; // 0-59
  amPm: string; // "AM" o "PM"
  meetingTypeCode?: string;
  meetingTypeName?: string;
  description: string;
  fine: number;
  waitingMinutes: number;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MeetingInputDto {
  name: string;
  meetingDate: string; // YYYY-MM-DD
  hour: number; // 1-12
  minute: number; // 0-59
  amPm: string; // "AM" o "PM"
  meetingTypeCode?: string;
  description?: string;
  fine: number;
  waitingMinutes: number;
}

export interface MeetingUpdateDto {
  name?: string;
  meetingDate?: string; // YYYY-MM-DD
  hour?: number; // 1-12
  minute?: number; // 0-59
  amPm?: string; // "AM" o "PM"
  meetingTypeCode?: string;
  description?: string;
  fine: number;
  waitingMinutes?: number;
}

// ============================================
// MEETING TYPE (TIPO DE REUNIÓN)
// ============================================

export interface MeetingTypeOutputDto {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

// ============================================
// MEETING-PARTNER (ASIGNACIÓN DE SOCIOS A REUNIONES)
// ============================================

export interface MeetingPartnerOutputDto {
  id: string;
  meetingId: string;
  meetingName: string;
  partnerId: string;
  partnerName: string;
  partnerNumber?: number;
  partnerIdentificationNumber: string;
  active: boolean;
  createdAt: string;
}

export interface AssignPartnersToMeetingDto {
  partnerIds: string[];
}

export interface MeetingPartnerAssignmentDto {
  meetingId: string;
  meetingName: string;
  assignedPartners: PartnerAssignmentInfoDto[];
}

// ============================================
// MEETING-ATTENDANCE (ASISTENCIA DE SOCIOS A REUNIONES)
// ============================================

export interface MeetingAttendanceOutputDto {
  id: string;
  meetingId: string;
  meetingName: string;
  partnerId: string;
  partnerName: string;
  partnerNumber?: number;
  partnerIdentificationNumber: string;
  attendanceDate: string; // YYYY-MM-DD
  present: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MeetingAttendanceInputDto {
  meetingId: string;
  partnerId: string;
  attendanceDate: string; // YYYY-MM-DD
  present: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface MeetingAttendanceUpdateDto {
  present?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface BulkMeetingAttendanceInputDto {
  meetingId: string;
  attendanceDate: string; // YYYY-MM-DD
  attendances: PartnerAttendanceDto[];
}

