export interface CityOutputDto {
    id: string;
    code: string;
    name: string;
    description: string;
}

export interface CountryOutputDto {
    id: string;
    code: string;
    name: string;
    description: string;
    cities: CityOutputDto[];
}

export interface CivilStatusTypeOutputDto {
    id: string;
    code: string;
    name: string;
}

export interface GenderTypeOutputDto {
    id: string;
    code: string;
    name: string;
}

export interface PaymentTypeOutputDto {
    id: string;
    code: string;
    name: string;
    description: string;
}

export interface CashFlowTypeOutputDto {
    id: string;
    code: string;
    name: string;
    description: string;
}

export interface CommonOutputDto {
    countries: CountryOutputDto[];
    civilStatusTypes: CivilStatusTypeOutputDto[];
    genderTypes: GenderTypeOutputDto[];
    paymentTypes: PaymentTypeOutputDto[];
    cashFlowTypes: CashFlowTypeOutputDto[];
}
