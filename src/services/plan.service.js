const Plan = require("../models/plan.model");

createPlanSV = async (plan, price, duration, is_popular, is_active) => {
    try {
        const newPlan = await Plan.create({
            plan,
            price,
            duration,
            is_popular,
            is_active,
        });
        return newPlan;
    } catch (error) {
        throw error;
    }
};

getPlansSV = async () => {
    try {
        const plans = await Plan.find({ is_active: true });
        return plans;
    } catch (error) {
        throw error;
    }
};


getPlanSV = async (global_id) => {
    try {
        const plan = await Plan.findOne({ global_id: global_id });
        return plan;
    } catch (error) {
        throw error;
    }
};

updatePlanSV = async (global_id, plan, price, duration, is_popular, is_active) => {
    try {
        const updatedPlan = await Plan.findOneAndUpdate(
            { global_id: global_id }, // find by global_id
            { plan, price, duration, is_popular, is_active }, // update the plan
            { new: true } // Return the updated document after applied changes
        );
        if (!updatedPlan) {
            throw new Error('Plan not found');
        }
        return updatedPlan;
    } catch (error) {
        throw error;
    }
}

togglePlanActivation = async (global_id) => {
    try {
        const plan = await Plan.findOne({ global_id: global_id });
        if (!plan) {
            throw new Error('Plan not found');
        }
        const updatedPlan = await Plan.findOneAndUpdate(
            { global_id: global_id }, // Query to find the plan
            { is_active: !plan.is_active }, // Toggle the is_active field
            { new: true } // Return the updated document
        );
        return updatedPlan;
    } catch (error) {
        throw error; 
    }
};

module.exports = {
    createPlanSV,
    getPlansSV,
    getPlanSV,
    updatePlanSV,
    togglePlanActivation,
};