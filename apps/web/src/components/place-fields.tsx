"use client";

import { useId, useMemo } from "react";
import {
  cityNamesForDistrict,
  districtNameForCity,
  sriLankaDistrictNames,
} from "@ceylonweddings/contracts";
import { Combobox } from "@ceylonweddings/ui/components/combobox";
import { FieldBlock } from "@ceylonweddings/ui/domain/creator-form";

function withCurrent(options: string[], current: string) {
  if (!current.trim()) return options;
  if (options.some((option) => option === current)) return options;
  return [current, ...options];
}

export function PlaceFields({
  city,
  district,
  onCityChange,
  onDistrictChange,
  cityLabel = "City",
  districtLabel = "District",
  className,
  fieldClass,
}: {
  city: string;
  district: string;
  onCityChange: (city: string) => void;
  onDistrictChange: (district: string) => void;
  cityLabel?: string;
  districtLabel?: string;
  className?: string;
  fieldClass?: string;
}) {
  const uid = useId();
  const inferredDistrict = district || districtNameForCity(city) || "";
  const districtOptions = useMemo(
    () => withCurrent(sriLankaDistrictNames(), inferredDistrict).map((name) => ({ value: name, label: name })),
    [inferredDistrict],
  );
  const cityOptions = useMemo(
    () => withCurrent(cityNamesForDistrict(inferredDistrict), city).map((name) => ({ value: name, label: name })),
    [city, inferredDistrict],
  );

  return (
    <div className={className ?? "grid gap-5 sm:grid-cols-2"}>
      <FieldBlock label={districtLabel} htmlFor={`${uid}-district`}>
        <Combobox
          id={`${uid}-district`}
          className={fieldClass}
          value={inferredDistrict}
          onValueChange={(next) => {
            onDistrictChange(next);
            if (city && !cityNamesForDistrict(next).includes(city)) onCityChange("");
          }}
          options={districtOptions}
          placeholder="Search district"
          searchPlaceholder="Search districts…"
          emptyText="No district found"
        />
      </FieldBlock>
      <FieldBlock label={cityLabel} htmlFor={`${uid}-city`}>
        <Combobox
          id={`${uid}-city`}
          className={fieldClass}
          value={city}
          onValueChange={(next) => {
            onCityChange(next);
            if (!district) {
              const found = districtNameForCity(next);
              if (found) onDistrictChange(found);
            }
          }}
          options={cityOptions}
          placeholder={inferredDistrict ? "Search city" : "Pick a district first"}
          searchPlaceholder="Search cities…"
          emptyText="No city found"
          disabled={!inferredDistrict}
        />
      </FieldBlock>
    </div>
  );
}
