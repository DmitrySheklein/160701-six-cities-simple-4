import { createSHA256 } from '../../core/helpers/common.js';
import { User, userRoles } from '../../types/user.type.js';
const [defaultUser] = userRoles;
import typegoose, { defaultClasses, getModelForClass } from '@typegoose/typegoose';

const { prop, modelOptions } = typegoose;

export interface UserEntity extends defaultClasses.Base {}

@modelOptions({
  schemaOptions: {
    collection: 'users',
  },
})
export class UserEntity extends defaultClasses.TimeStamps implements User {
  @prop({ required: true, default: '' })
  public firstName = '';

  @prop({ unique: true, required: true })
  public email = '';

  @prop({ required: false, default: '' })
  public avatarPath = '';

  @prop({
    type: () => String,
    enum: userRoles,
  })
  public type = defaultUser;

  @prop({ required: true, default: '' })
  public password?: string;

  constructor({ email, firstName, avatarPath, type }: User) {
    super();

    this.email = email;
    this.firstName = firstName;
    this.avatarPath = avatarPath;
    // this.type = type;
  }

  public setPassword(password: string, salt: string) {
    this.password = createSHA256(password, salt);
  }

  public getPassword() {
    return this.password;
  }
}

export const UserModel = getModelForClass(UserEntity);
