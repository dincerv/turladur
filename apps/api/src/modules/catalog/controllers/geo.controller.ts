import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../../core/auth/decorators/public.decorator';
import { GeoService } from '../services/geo.service';

@ApiTags('Catalog - Geo')
@Controller('catalog/geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Public()
  @Get('places')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Place name search (Nominatim proxy) → lat/lng suggestions',
  })
  searchPlaces(@Query('q') q?: string) {
    return this.geoService.searchPlaces(q ?? '');
  }
}
