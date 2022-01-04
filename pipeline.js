//using pipeline to extract number of hits for a given query

module.exports.paginationPipeline = (query = "", offset = 0, size = 8) => [
  {
    $match: { $text: { $search: query } },
  },
  {
    $lookup: {
      from: "journeys",
      let: { journeyId: "$journey" },
      pipeline: [
        { $match: { $expr: { $eq: ["$_id", "$$journeyId"] } } },
        { $project: { 'title': 1 } },
      ],
      as: "journey",
    },
  },
  {
    $unwind: {
      path: "$journey",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $facet: {
      total: [
        {
          $count: "sum",
        },
      ],
      data: [
        {
          $sort: {
            posted: -1,
          },
        },
      ],
    },
  },
  {
    $unwind: "$total",
  },
  {
    $project: {
      items: {
        $slice: ["$data", offset, size],
      },
      count: "$total.sum",
    },
  },
];
