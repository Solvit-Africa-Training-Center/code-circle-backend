import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { User } from '../../users/entities/user.entity';

export enum TestType {
  CREATOR_TEST = 'CREATOR_TEST',
  MEMBER_TEST = 'MEMBER_TEST',
}

@Entity('tests')
export class Test {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Category, { nullable: false })
  category: Category;

  @Column({ type: 'enum', enum: TestType })
  type: TestType;

  @Column({ nullable: true })
  clubId?: string;

  @Column({ nullable: true })
  difficulty?: string;

  @Column({ type: 'int', default: 60 })
  passingScore: number;

  @ManyToOne(() => User, { nullable: true })
  createdBy?: User;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
