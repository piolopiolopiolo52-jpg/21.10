db.users.drop()

db.users.insertMany([
  {
    name: "Антон",
    loginHistory: [
      { date: ISODate("2025-10-01"), action: "login" },
      { date: ISODate("2025-10-10"), action: "logout" }
    ]
  },
  {
    name: "Мария",
    loginHistory: [
      { date: ISODate("2025-11-05"), action: "login" },
      { date: ISODate("2025-11-06"), action: "logout" }
    ]
  },
  {
    name: "Игорь",
    loginHistory: [
      { date: ISODate("2025-09-20"), action: "login" },
      { date: ISODate("2025-09-21"), action: "logout" }
    ]
  }
])

print("\n1️⃣ Пользователи, не входившие в систему последние 7 дней:")

const sevenDaysAgo = new Date()
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

db.users.aggregate([
  {
    $addFields: {
      lastLogin: {
        $max: {
          $map: {
            input: "$loginHistory",
            as: "entry",
            in: {
              $cond: [
                { $eq: ["$$entry.action", "login"] },
                "$$entry.date",
                null
              ]
            }
          }
        }
      }
    }
  },
  { $match: { $or: [ { lastLogin: { $lt: sevenDaysAgo } }, { lastLogin: null } ] } },
  { $project: { _id: 0, name: 1, lastLogin: 1 } }
]).forEach(printjson)

print("\n2️⃣ Добавляем запись о входе с текущей датой:")

const now = new Date()
db.users.updateMany(
  {},
  {
    $push: {
      loginHistory: { date: now, action: "login" }
    }
  }
)
print("✅ Добавлена запись о входе для всех пользователей.")

print("\n3️⃣ Удаляем все logout старше месяца:")

const monthAgo = new Date()
monthAgo.setMonth(monthAgo.getMonth() - 1)

db.users.updateMany(
  {},
  {
    $pull: {
      loginHistory: {
        action: "logout",
        date: { $lt: monthAgo }
      }
    }
  }
)
print("🧹 Старые logout-записи удалены.")

print("\n📋 Итоговая коллекция users:")
db.users.find({}, { _id: 0 }).forEach(printjson)
