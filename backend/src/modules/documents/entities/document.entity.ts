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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
