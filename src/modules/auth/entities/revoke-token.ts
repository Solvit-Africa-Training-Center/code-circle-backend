import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('revoked_tokens')
export class RevokedToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'token'})
  token: string;

  @Column({name: 'expires_in'})
  expiresAt: Date; // Optional: auto-delete expired tokens
}