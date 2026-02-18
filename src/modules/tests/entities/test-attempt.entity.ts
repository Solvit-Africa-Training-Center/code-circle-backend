// src/tests/entities/test-attempt.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
<<<<<<< HEAD
<<<<<<< HEAD
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Test } from './test.entity';
// import { User } from '../../users/entities/user.entity';
// import { Club } from '../../clubs/entities/club.entity';
=======
=======
  JoinColumn,
>>>>>>> 47d19eeb0b765cca3f1fd1b1f61257669183b75c
  CreateDateColumn,
} from 'typeorm';
import { Test } from './test.entity';
<<<<<<< HEAD
>>>>>>> 5680879da89b28f3643ae1af4baf1994f207647e
=======
import { TestPurpose } from '../enums/test-type.enum';
>>>>>>> 47d19eeb0b765cca3f1fd1b1f61257669183b75c

@Entity('test_attempts')
export class TestAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

<<<<<<< HEAD
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
=======
  // Référence au User (sans relation TypeORM)
  @Column()
  userId: string;
>>>>>>> 47d19eeb0b765cca3f1fd1b1f61257669183b75c

  @ManyToOne(() => Test, { eager: true })
  @JoinColumn({ name: 'testId' })
  test: Test;

  @Column()
  testId: string;

  // Pour savoir pourquoi le user passe le test
  @Column({
    type: 'enum',
    enum: TestPurpose,
    nullable: true,
  })
  purpose?: TestPurpose;

  // Si CREATE_CLUB
  @Column({ nullable: true })
  intendedCategoryId: string;

  @Column({ nullable: true })
  intendedClubName: string;

  // Si JOIN_CLUB
  @Column({ nullable: true })
  targetClubId: string;

  @Column({ type: 'jsonb' })
  answers: Record<string, string>;

  @Column({ type: 'int' })
  score: number;

  @Column()
  passed: boolean;

  @Column({ default: false })
  correctedByAI: boolean;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @CreateDateColumn()
  attemptedAt: Date;

<<<<<<< HEAD
  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
>>>>>>> 5680879da89b28f3643ae1af4baf1994f207647e
=======
  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;
>>>>>>> 47d19eeb0b765cca3f1fd1b1f61257669183b75c
}
