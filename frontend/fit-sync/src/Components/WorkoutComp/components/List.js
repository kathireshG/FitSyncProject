import React, { useState } from "react";
import "boxicons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const List = ({ calorieList, deleteCalorie, setSelectedItem }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const filteredCalorieList = calorieList.filter(
    (item) => new Date(item.date).toDateString() === selectedDate.toDateString()
  );

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="flex flex-col py-6 gap-4">
      <h1 className="py-4 font-bold text-xl"> Exercise Log </h1>
      <div className="flex items-center">
        <label className="mr-2 text-gray-600">Select Date:</label>
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          className="border rounded p-2"
        />
      </div>
      {filteredCalorieList.map((value, index) => (
        <CalorieIntake
          key={index}
          category={value}
          deleteCalorie={deleteCalorie}
          setSelectedItem={setSelectedItem}
        />
      ))}
    </div>
  );
};

const CalorieIntake = ({ category, deleteCalorie, setSelectedItem }) => {
  if (!category) return null;

  const handleUpdateClick = () => {
    setSelectedItem(category);
  };

  const handleDeleteClick = () => {
    deleteCalorie(category._id);
  };

  return (
    <div className="bg-white shadow-md rounded-lg px-4 py-3 mt-3">
      <div className="flex justify-between">
        <div>
          <h2 className="font-semibold text-lg">
            {category.name ?? "Unknown"}
          </h2>
          <p className="text-gray-600">{category.amount ?? 0} Calories</p>
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-gray-600">{category.duration ?? 0} min</p>
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-gray-600">
            {category.date
              ? new Date(category.date).toLocaleDateString()
              : "Unknown Date"}
          </p>
          <button
            className="text-red-500 hover:text-red-700"
            onClick={handleDeleteClick}
          >
            <box-icon name="trash" color="red"></box-icon>
          </button>
          <button
            className="text-blue-500 hover:text-blue-700"
            onClick={handleUpdateClick}
          >
            <box-icon name="pencil" color="blue"></box-icon>
          </button>
        </div>
      </div>
    </div>
  );
};

export default List;
