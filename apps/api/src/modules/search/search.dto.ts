import { createZodDto } from "nestjs-zod";
import { searchQuerySchema } from "@ceylonweddings/contracts";

export class SearchQueryDto extends createZodDto(searchQuerySchema) {}
