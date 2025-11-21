const { Model, DataTypes } = require('sequelize');

class GameM extends Model {
  static initModel(sequelize) {
    GameM.init({
      word: { type: DataTypes.STRING, allowNull: false },
      player1_id: { type: DataTypes.INTEGER, allowNull: false },
      player2_id: { type: DataTypes.INTEGER, allowNull: false },
      turno_atual: { type: DataTypes.INTEGER, defaultValue: 1 },
      estado: { type: DataTypes.TEXT, defaultValue: '' },
      status_final: { type: DataTypes.STRING, allowNull: true },
      vencedor_id: { type: DataTypes.INTEGER, allowNull: true }
    }, {
      sequelize,
      tableName: 'games',
      modelName: 'GameM'
    });
    return GameM;
  }

  static associate(models) {
    this.belongsTo(models.Player, { as: 'player1', foreignKey: 'player1_id' });
    this.belongsTo(models.Player, { as: 'player2', foreignKey: 'player2_id' });
    this.belongsTo(models.Sala, { foreignKey: 'sala_id', as: 'sala' }); // opcional
  }
}

module.exports = GameM;

