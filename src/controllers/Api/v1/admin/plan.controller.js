const {successResponse, errorResponse} = require('../../baseAPI.controller');
const PlanService = require('../../../../services/plan.service');

const getPlans = async (req, res) => {
    try {
        const plans = await PlanService.getPlansAdminSV();
        successResponse(res, plans, 'Plans fetched successfully');
    } catch (error) {
        errorResponse(res, error.message || 'Internal server error');
    }
}

const getPlan = async (req, res) => {
    try {
        const global_id = req.params.id;
        const plan = await PlanService.getPlanSV(global_id);
        successResponse(res, plan, 'Plan fetched successfully');
    } catch (error) {
        errorResponse(res, error.message || 'Internal server error');
    }
}

const createPlan = async (req, res) => {
    try {
        const { plan, price, duration, total_price, is_annual, description, is_popular, is_active } = req.body;

        const newPlan = await PlanService.createPlanSV(plan, price, duration, total_price, is_annual, description, is_popular, is_active);
        successResponse(res, newPlan, 'Plan created successfully');
    } catch (error) {
        errorResponse(res, error.message || 'Internal server error');
    }
}

const updatePlan = async (req, res) => {
    try {
        const { plan, price, duration, is_popular, is_active } = req.body;
        const global_id = req.params.id;

        const updatedPlan = await PlanService.updatePlanSV(global_id, plan, price, duration, is_popular, is_active);
        successResponse(res, updatedPlan, 'Plan updated successfully');
    } catch (error) {
        errorResponse(res, error.message || 'Internal server error');
    }
}

const togglePlanActivation = async (req, res) => {
    try {
        const global_id = req.params.id;

        const updatedPlan = await PlanService.togglePlanActivation(global_id);
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