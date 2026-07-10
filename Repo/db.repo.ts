import mongoose from "mongoose";

export default class DBRepo<T> {
  constructor(protected model: mongoose.Model<T>) {}

  async create(doc: Partial<T>): Promise<any> {
    return await this.model.create(doc);
  }

  async findOne({
    filter,
    select,
    options,
  }: {
    filter: any;
    select?: string | string[];
    options?: any;
  }): Promise<any> {
    return await this.model.findOne(filter, select, options);
  }

  async findById({
    id,
    select,
    options,
  }: {
    id: string;
    select?: string | string[];
    options?: any;
  }): Promise<any> {
    return await this.model.findById(id, select, options);
  }

  async find({
    filter,
    select,
    options,
  }: {
    filter: any;
    select?: string | string[];
    options?: any;
  }): Promise<any[]> {
    return await this.model.find(filter, select, options);
  }

  async findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter: any;
    update: any;
    options?: any;
  }): Promise<any> {
    return await this.model.findOneAndUpdate(filter, update, { new: true, ...options });
  }

  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: any;
    update: any;
    options?: any;
  }): Promise<any> {
    return await this.model.updateOne(filter, update, options);
  }

  getDBDoc(doc: Partial<T>): any {
    return new this.model(doc);
  }

  async saveDBDoc(doc: mongoose.Document): Promise<any> {
    return await doc.save();
  }

  async deleteOne({
    filter,
    options,
  }: {
    filter: any;
    options?: any;
  }): Promise<any> {
    return await this.model.deleteOne(filter, options);
  }

  async paginate({
    filter,
    page = 1,
    limit = 10,
    select,
    options,
  }: {
    filter: any;
    page?: number;
    limit?: number;
    select?: string | string[];
    options?: any;
  }) {
    const skip = (page - 1) * limit;
    const totalItems = await this.model.countDocuments(filter);
    const data = await this.model.find(filter, select, { skip, limit, ...options });
    const totalPages = Math.ceil(totalItems / limit);
    return {
      data,
      totalItems,
      page,
      limit,
      totalPages,
    };
  }
}
