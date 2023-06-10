class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter(...fields) {
    const queryObj = { ...this.queryString };
    const excludedFields = [
      'page',
      'sort',
      'limit',
      'search',
      'fields',
      ...fields,
    ];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  clone() {
    const clonedQuery = { ...this.query };
    const clonedQueryString = { ...this.queryString };
    return new APIFeatures(clonedQuery, clonedQueryString);
  }

  filterTags() {
    if (this.queryString.tags) {
      const tags = this.queryString.tags.split(',').map((tag) => tag.trim());
      this.query = this.query.where('tags').in(tags);
    }
    return this;
  }

  filterCategory() {
    if (this.queryString.category) {
      const category = this.queryString.category
        .split(',')
        .map((category) => category.trim());
      this.query = this.query.where('category').in(category);
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  search() {
    const { search } = this.queryString;
    if (search) {
      console.log(search);
      const searchRegex = new RegExp(search, 'i');
      this.query = this.query.where('name').regex(searchRegex);
      console.log(this.query);
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  async count() {
    try {
      const count = await this.query;
      console.log(count);
      return 10;
    } catch (error) {
      throw new Error('Error counting documents.');
    }
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
