const Product = require('../models/product');

exports.getStats = async () => {

  const [result] = await Product.aggregate([

    {
      $facet: {

        // 1️⃣ Stock Health
        stockHealth: [
          {
            $project: {
              name: 1,
              stock: 1,
              status: {
                $cond: [
                  { $lt: ["$stock", 10] },
                  "critical",
                  "healthy"
                ]
              }
            }
          }
        ],

        // 2️⃣ Revenue & Volume
        revenueAndVolume: [
          {
            $lookup: {
              from: "orders",
              localField: "_id",
              foreignField: "productId",
              as: "orders"
            }
          },
          { $unwind: { path: "$orders", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: { $ifNull: ["$orders.total", 0] } },
              totalItemsSold: { $sum: { $ifNull: ["$orders.quantity", 0] } }
            }
          }
        ],

        // 3️⃣ Top 3 Categories
        topCategories: [
          {
            $lookup: {
              from: "orders",
              localField: "_id",
              foreignField: "productId",
              as: "orders"
            }
          },
          { $unwind: "$orders" },
          {
            $group: {
              _id: "$category",
              revenue: { $sum: "$orders.total" }
            }
          },
          { $sort: { revenue: -1 } },
          { $limit: 3 }
        ],

        // 4️⃣ Conversion Speed
        conversionSpeed: [
          {
            $lookup: {
              from: "orders",
              localField: "_id",
              foreignField: "productId",
              as: "orders"
            }
          },
          { $unwind: "$orders" },
          {
            $group: {
              _id: "$_id",
              productCreated: { $first: "$createdAt" },
              firstOrder: { $min: "$orders.createdAt" }
            }
          },
          {
            $project: {
              diff: { $subtract: ["$firstOrder", "$productCreated"] }
            }
          },
          {
            $group: {
              _id: null,
              avgConversionMs: { $avg: "$diff" }
            }
          }
        ]

      }
    }

  ]);

  // 🔥 Format stock health properly
  const criticalStock = result.stockHealth
    .filter(p => p.status === "critical")
    .map(p => ({ name: p.name, stock: p.stock }));

  const healthyStock = result.stockHealth
    .filter(p => p.status === "healthy")
    .map(p => ({ name: p.name, stock: p.stock }));


  return {
    revenue: result.revenueAndVolume[0]?.totalRevenue || 0,
    itemsSold: result.revenueAndVolume[0]?.totalItemsSold || 0,
    criticalStock,
    healthyStock,
    topCategories: result.topCategories || [],
    avgConversionMs: result.conversionSpeed[0]?.avgConversionMs || 0
  };
};