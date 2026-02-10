import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Test } from './test.entity';
// import { User } from '../../users/entities/user.entity';
// import { Club } from '../../clubs/entities/club.entity';

@Entity('test_attempts')
export class TestAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
}
