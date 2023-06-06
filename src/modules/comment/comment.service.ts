import { inject, injectable } from 'inversify';
import { DocumentType, types } from '@typegoose/typegoose';
import { CommentServiceInterface } from './comment-service.interface.js';
import { AppComponent } from '../../types/app-component.enum.js';
import CreateCommentDto from './dto/create-comment.dto.js';
import { CommentEntity } from './comment.entity.js';
import { Types } from 'mongoose';

@injectable()
export default class CommentService implements CommentServiceInterface {
  constructor(
    @inject(AppComponent.CommentModel) private readonly commentModel: types.ModelType<CommentEntity>,
  ) {}

  public async create(dto: CreateCommentDto): Promise<DocumentType<CommentEntity>> {
    const comment = await this.commentModel.create(dto);
    return comment.populate('userId');
  }

  public async findByOfferId(offerId: string): Promise<DocumentType<CommentEntity>[]> {
    return this.commentModel.find({ offerId }).populate('userId');
  }

  public async deleteByOfferId(offerId: string): Promise<number> {
    const result = await this.commentModel.deleteMany({ offerId }).exec();

    return result.deletedCount;
  }

  public async countRatingByRentId(rentId: string): Promise<number | null> {
    const objectOfferId = new Types.ObjectId(rentId);

    const result = await this.commentModel
      .aggregate([
        {
          $match: {
            offerId: objectOfferId,
          },
        },
        {
          $group: {
            _id: objectOfferId,
            rating: { $avg: '$rating' },
          },
        },
        {
          $merge: {
            into: 'offers',
            on: '_id',
            whenMatched: 'merge',
            whenNotMatched: 'discard',
          },
        },
      ])
      .exec();
    console.log('result', result);

    return result?.[0]?.rating ?? null;
  }
}
