/**
 * Generic pagination helper for Mongoose models.
 */
const paginate = async (model, filter, options) => {
  const { page = 1, limit = 20, sort = { createdAt: -1 }, populate = '', select = '' } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.find(filter).sort(sort).skip(skip).limit(limit).populate(populate).select(select),
    model.countDocuments(filter)
  ]);

  return {
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = { paginate };
