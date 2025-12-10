import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum IdeaStatus {
  INBOX = 'inbox',
  EVALUATING = 'evaluating',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum IdeaCategory {
  PRODUCT = 'product',
  MARKETING = 'marketing',
  TECHNOLOGY = 'technology',
  BUSINESS = 'business',
  DESIGN = 'design',
  OTHER = 'other',
}

@Entity('ideas')
export class Idea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: IdeaStatus,
    default: IdeaStatus.INBOX,
  })
  status: IdeaStatus;

  @Column({
    type: 'enum',
    enum: IdeaCategory,
    default: IdeaCategory.OTHER,
  })
  category: IdeaCategory;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ type: 'int', default: 5 })
  impact: number;

  @Column({ type: 'int', default: 5 })
  effort: number;

  @Column({ type: 'float', nullable: true })
  priorityScore: number;

  @Column({ type: 'jsonb', nullable: true })
  checklist: {
    id: string;
    text: string;
    completed: boolean;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  attachments: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  links: {
    id: string;
    title: string;
    url: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  snapshots: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  lastSavedState: {
    whereIStopped: string;
    whatIWasDoing: string;
    nextSteps: string;
    savedAt: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  timeline: {
    id: string;
    action: string;
    description: string;
    timestamp: string;
  }[];

  @Column('simple-array', { nullable: true })
  linkedDocIds: string[];

  @ManyToOne(() => User, (user) => user.ideas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
