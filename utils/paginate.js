// export const paginate = async (Model, page = 1, limit = 10, populate = []) => {
//   const skip = (page - 1) * limit;

//   const totalItems = await Model.countDocuments();
//   let query = Model.find().skip(skip).limit(limit);

//   if (populate.length > 0) {
//     populate.forEach((p) => {
//       query = query.populate(p);
//     });
//   }

//   const data = await query.lean();

//   const cleanedData = data.map((item) => {
//     const newItem = { ...item };
//     for (const key of Object.keys(item)) {
//       if (key.endsWith("Id") && item[key] && typeof item[key] === "object") {
//         const newKey = key.replace(/Id$/, "");
//         newItem[newKey] = item[key];
//         delete newItem[key];
//       }
//     }
//     return newItem;
//   });

//   return {
//     currentPage: page,
//     totalPages: Math.ceil(totalItems / limit),
//     totalItems,
//     data: cleanedData,
//   };
// };
