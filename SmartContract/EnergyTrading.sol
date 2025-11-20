// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EnergyTrading {
    event TradeCreated(
        uint256 indexed tradeId,
        address indexed seller,
        address indexed buyer,
        uint256 energyAmountKwh,
        uint256 pricePerKwh
    );

    function recordTrade(
        uint256 _tradeId,
        address _seller,
        address _buyer,
        uint256 _energyAmountKwh,
        uint256 _pricePerKwh
    ) external {
        emit TradeCreated(
            _tradeId,
            _seller,
            _buyer,
            _energyAmountKwh,
            _pricePerKwh
        );
    }
}
