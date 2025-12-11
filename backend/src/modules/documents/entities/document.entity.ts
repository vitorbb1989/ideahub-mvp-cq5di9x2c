import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DocumentType {
  FILE = 'file',
  FOLDER = 'folder',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.FILE,
  })
  type: DocumentType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true })
  parentId: string;

  @Column({ type: 'jsonb', nullable: true })
  versions: {
    id: string;
    content: string;
    createdAt: string;
    description: string;
  }[];

  @ManyToOne(() => User, (user) => user.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  // Audit fields - track who created and last modified the record
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdBy' })
  createdByUser: User;

  @Column({ nullable: true })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updatedBy' })
  updatedByUser: User;

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Soft delete - when set, record is considered deleted but remains in database
  // TypeORM automatically filters out soft-deleted records in queries
  @DeleteDateColumn()
  deletedAt: Date | null;
}
