import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  //OneToMany,
} from 'typeorm';
// import { Club } from '../../clubs/entities/club.entity';
// import { Test } from '../../tests/entities/test.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations (à décommenter plus tard)
  // @OneToMany(() => Club, (club) => club.category)
  // clubs: Club[];

  // @OneToMany(() => Test, (test) => test.category)
  // tests: Test[];
}
