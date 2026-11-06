<?php
$flag = isset( $_GET['reserva'] ) ? sanitize_key( $_GET['reserva'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
$msg  = tacho_booking_message( $flag );
$min  = gmdate( 'Y-m-d' );
$max  = gmdate( 'Y-m-d', strtotime( '+90 days' ) );
?>
<section class="section" id="reservas">
	<div class="wrap contact-grid">
		<div>
			<p class="eyebrow">Reservas</p>
			<h2>Guarde a sua mesa.</h2>
			<p class="lead">Confirmamos por telefone no mesmo dia. Para grupos acima de 12 pessoas, ligue para a casa.</p>
			<ul class="contact-list">
				<li><span>Telefone</span><strong><?php echo esc_html( tacho_opt( 'phone' ) ); ?></strong></li>
				<li><span>Endereço</span><strong><?php echo esc_html( tacho_opt( 'address' ) ); ?></strong></li>
				<li><span>Horário</span><strong><?php echo esc_html( tacho_opt( 'hours' ) ); ?></strong></li>
			</ul>
		</div>
		<form class="form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" novalidate>
			<?php if ( 'ok' === $flag ) : ?><p class="notice ok" role="status">Pedido recebido! Vamos confirmar a sua mesa por telefone.</p><?php endif; ?>
			<?php if ( $msg ) : ?><p class="notice err" role="alert"><?php echo esc_html( $msg ); ?></p><?php endif; ?>
			<input type="hidden" name="action" value="tacho_booking">
			<?php wp_nonce_field( 'tacho_booking' ); ?>
			<div class="hp" aria-hidden="true"><label>Site <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
			<label>Seu nome <input type="text" name="nome" required autocomplete="name"></label>
			<label>Telefone com DDD <input type="tel" name="telefone" required autocomplete="tel" inputmode="tel" placeholder="(41) 90000-0000"></label>
			<div class="three">
				<label>Data <input type="date" name="data" required min="<?php echo esc_attr( $min ); ?>" max="<?php echo esc_attr( $max ); ?>"></label>
				<label>Horário
					<select name="hora" required>
						<option value="">Escolha</option>
						<?php foreach ( tacho_slots() as $s ) : ?><option><?php echo esc_html( $s ); ?></option><?php endforeach; ?>
					</select>
				</label>
				<label>Pessoas <input type="number" name="pessoas" required min="1" max="12" value="2" inputmode="numeric"></label>
			</div>
			<label>Observações <textarea name="obs" rows="3" maxlength="400" placeholder="Restrição alimentar, aniversário, cadeirinha…"></textarea></label>
			<button class="btn" type="submit">Pedir reserva</button>
		</form>
	</div>
</section>
