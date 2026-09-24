import sriLanka from "./sri-lanka.json";

export type GeoPlace = {
  id: string;
  name: string;
};

export type GeoDistrict = GeoPlace & {
  cities: GeoPlace[];
};

export type GeoCatalog = {
  country: string;
  countryLabel: string;
  districts: GeoDistrict[];
};

export const SRI_LANKA: GeoCatalog = sriLanka;

function norm(value: string) {
  return value.trim().toLowerCase();
}

export function sriLankaDistricts(): GeoDistrict[] {
  return SRI_LANKA.districts;
}

export function sriLankaDistrictNames(): string[] {
  return SRI_LANKA.districts.map((district) => district.name);
}

export function findSriLankaDistrict(name: string | null | undefined): GeoDistrict | undefined {
  if (!name?.trim()) return undefined;
  const needle = norm(name);
  return SRI_LANKA.districts.find((district) => norm(district.name) === needle || district.id === needle);
}

export function citiesForDistrict(districtName: string | null | undefined): GeoPlace[] {
  return findSriLankaDistrict(districtName)?.cities ?? [];
}

export function cityNamesForDistrict(districtName: string | null | undefined): string[] {
  return citiesForDistrict(districtName).map((city) => city.name);
}

export function districtNameForCity(cityName: string | null | undefined): string | undefined {
  if (!cityName?.trim()) return undefined;
  const needle = norm(cityName);
  for (const district of SRI_LANKA.districts) {
    if (district.cities.some((city) => norm(city.name) === needle || city.id === needle)) {
      return district.name;
    }
  }
  return undefined;
}
