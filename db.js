const { Model, DataTypes, Sequelize } = require("@sequelize/core");

const DB_URL = "postgres://postgres:postgres@localhost:5432/test";
const sequelize = new Sequelize(DB_URL);

class EmployeeDetails extends Model {}
EmployeeDetails.init(
  {
    employee_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    password: DataTypes.STRING,
    date_of_birth: DataTypes.DATE,
    contact_number: DataTypes.STRING,
  },
  { sequelize, modelName: "111915124_detail" }
);

class EmployeeSalary extends Model {}
EmployeeSalary.init(
  {
    employee_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    job_role: DataTypes.STRING,
    monthly_salary: DataTypes.STRING,
    yearly_bonus: DataTypes.STRING,
  },
  { sequelize, modelName: "111915124_salary" }
);

module.exports = { EmployeeDetails, EmployeeSalary, sequelize };
