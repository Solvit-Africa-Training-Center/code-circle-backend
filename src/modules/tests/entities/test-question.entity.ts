import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Test } from './test.entity';

@Entity('test_questions')
export class TestQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Test, (test) => test.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'testId' })
  test: Test;

  @Column()
  testId: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'jsonb' })
  options: string[]; // ['Option A', 'Option B', 'Option C', 'Option D']

  @Column()
  correctAnswer: string; // L'option correcte

  @Column({ type: 'int', default: 10 })
  points: number; // Points attribués pour cette question

  @Column({ type: 'int' })
  orderIndex: number; // Ordre d'affichage de la question

  @CreateDateColumn()
  createdAt: Date;
}
