const {successResponse, errorResponse} = require('../../baseAPI.controller');
const Plan = require('../../../../models/plan.model');
const getPlans = async (req, res) => {
    try {
        const plans = await getPlansAdminSV();
        successResponse(res, plans, 'Plans fetched successfully');
    } catch (error) {
        errorResponse(res, error.message || 'Internal server error');
    }
}

const getPlan = async (req, res) => {
    try {
        const id = req.params.id;
        const plan = Plan.findOne({ _id: id }); 
        successResponse(res, plan, 'Plan fetched successfully');
    } catch (error) {
        errorResponse(res, error.message || 'Internal server error');
    }
}

const createPlan = async (req, res) => {
    try {
        const { plan, price, duration, total_price, is_annual, description, is_popular, is_active } = req.body;

        const newPlan = await createPlanSV(plan, price, duration, total_price, is_annual, description, is_popular, is_active);
        successResponse(res, newPlan, 'Plan created successfully');
    } catch (error) {
        errorResponse(res, error.message || 'Internal server error');
    }
}

const updatePlan = async (req, res) => {
    try {
        const { plan, price, duration, is_popular, is_active } = req.body;
        const id = req.params.id;

        const updatedPlan = await Plan.findOneAndUpdate(
            { _id: id }, // find by global_id
            { plan, price, duration, is_popular, is_active }, // update the plan
            { new: true } // Return the updated document after applied changes
        );
            successResponse(res, updatedPlan, 'Plan updated successfully');
    } catch (error) {
        errorResponse(res, error.message || 'Internal server error');
    }
}

const togglePlanActivation = async (req, res) => {
    try {
        const id = req.params.id;

        const updatedPlan = await Plan.findOneAndUpdate(
            { _id: id }, // find by global_id
            { $set: { is_active: !is_active } }, // update the plan
            { new: true } // Return the updated document after applied changes
        );
        successResponse(res, updatedPlan, 'Plan activation toggled successfully');
    } catch (error) {
        errorResponse(res, error.message || 'Internal server error');
    }
}

module.exports = {
    getPlans,
    getPlan,
    createPlan,
    updatePlan,
    togglePlanActivation,
};