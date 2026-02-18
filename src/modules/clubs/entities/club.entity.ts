/* eslint-disable @typescript-eslint/no-unsafe-return */
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
//import { User } from '../../users/entities/user.entity';
//import { Membership } from '../../memberships/entities/membership.entity';
import { Test } from '../../tests/entities/test.entity';

@Entity('clubs')
export class Club {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: string;

  // //Relation avec User (à décommenter quand le module User sera prêt)
  // @ManyToOne(() => User)
  // @JoinColumn({ name: 'creatorId' })
  // creator: User;

  @Column()
  creatorId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations (à décommenter plus tard)
  // @OneToMany(() => Membership, (membership) => membership.club)
  // memberships: Membership[];

  @OneToMany(() => Test, (test) => test.club)
  memberTests: Test[];
}
