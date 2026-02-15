import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
<<<<<<< HEAD
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Test } from './test.entity';
// import { User } from '../../users/entities/user.entity';
// import { Club } from '../../clubs/entities/club.entity';
=======
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Test } from './test.entity';
>>>>>>> 5680879da89b28f3643ae1af4baf1994f207647e

@Entity('test_attempts')
export class TestAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

<<<<<<< HEAD
  // @ManyToOne(() => User)
  // @JoinColumn({ name: 'userId' })
  // user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Test, { eager: true })
  @JoinColumn({ name: 'testId' })
  test: Test;

  @Column()
  testId: string;

  // Optionnel - si c'est pour rejoindre un club spécifique
  @Column({ nullable: true })
  clubId: string;

  // @ManyToOne(() => Club, { nullable: true })
  // @JoinColumn({ name: 'clubId' })
  // club: Club;

  @Column({ type: 'jsonb' })
  answers: Record<string, string>; // { "questionId": "selectedAnswer" }

  @Column({ type: 'int' })
  score: number; // Score obtenu (en pourcentage)

  @Column()
  passed: boolean; // Si le test a été réussi

  @Column({ default: false })
  correctedByAI: boolean; // Si corrigé par l'IA

  @Column({ type: 'text', nullable: true })
  feedback: string; // Feedback de l'IA

  @CreateDateColumn()
  attemptedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;
=======
  @ManyToOne(() => User, { nullable: false })
  user: User;

  @ManyToOne(() => Test, { nullable: false })
  test: Test;

  @Column({ nullable: true })
  clubId?: string;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ default: false })
  passed: boolean;

  @Column({ default: false })
  correctedByAI: boolean;

  @Column({ type: 'json', nullable: true })
  answers?: any;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @CreateDateColumn({ name: 'attempted_at' })
  attemptedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
>>>>>>> 5680879da89b28f3643ae1af4baf1994f207647e
}
