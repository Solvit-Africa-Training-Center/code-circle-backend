import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
// import { User } from '../../users/entities/user.entity';
import { Club } from '../../clubs/entities/club.entity';
import { TestQuestion } from './test-question.entity';
import { TestAttempt } from './test-attempt.entity';
import { TestType, TestDifficulty } from '../enums/test-type.enum';

@Entity('tests')
export class Test {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TestType })
  type: TestType;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: string;

  // Pour les tests de membres (créés par les créateurs de clubs)
  @Column({ nullable: true })
  clubId: string;

  @ManyToOne(() => Club, { nullable: true })
  @JoinColumn({ name: 'clubId' })
  club: Club;

  @Column({
    type: 'enum',
    enum: TestDifficulty,
    nullable: true,
  })
  difficulty: TestDifficulty;

  @Column({ type: 'int', default: 70 })
  passingScore: number; // Score minimum pour réussir (en pourcentage)

  // null si généré par l'IA, sinon l'ID du créateur
  @Column({ nullable: true })
  createdBy: string;

  // @ManyToOne(() => User, { nullable: true })
  // @JoinColumn({ name: 'createdBy' })
  // creator: User;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => TestQuestion, (question) => question.test, {
    cascade: true,
  })
  questions: TestQuestion[];

  @OneToMany(() => TestAttempt, (attempt) => attempt.test)
  attempts: TestAttempt[];
}
