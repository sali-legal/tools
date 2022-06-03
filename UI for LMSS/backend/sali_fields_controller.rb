class Client::SaliFieldsController < Client::BaseController
  def index
    authorize! :read, SaliField
    respond_with NCQuery::SaliField.search(params, current_ability)
  end

  def search
    authorize! :read, SaliField
    render json: SaliField.search_path(params[:str])
  end

  def massload
    authorize! :read, SaliField
    render json: NCQuery::SaliField.massload(params, current_ability)
  end

  def text_search
    authorize! :read, SaliField
    render json: SaliField.search(params[:str]).limit(20), each_serializer: SaliFieldSerializer::MiniSerializer
  end
end
