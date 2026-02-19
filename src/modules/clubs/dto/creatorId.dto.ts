import { CreateClubDto } from './create-club.dto';
import { OmitType } from '@nestjs/swagger';

export class CreateClubInputDto extends OmitType(CreateClubDto, [] as const) {}
